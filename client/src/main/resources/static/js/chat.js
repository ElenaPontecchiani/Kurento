//CODICE JS PER LA CHAT
//Viene utilizzato un server Scaledrone per il processo di signaling, mentre per il resto non serve nessun intermediario
// Genera hash per la chat casuale (codice dopo # nell'URL che identifica univocamente la room)

if (!location.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const chatHash = location.hash.substring(1);

//Utilizzo ScaleDrone
const drone = new ScaleDrone('yiS12Ts5RdNhebyM');
//Le room di Scaledrone necessitano del prefisso'observable-'
const roomName = 'observable-' + chatHash;
//Room Scaledrone per il processo di scambio di segnali
let room;

const configuration = {
    iceServers: [{
        url: 'stun:stun.l.google.com:19302'
    }]
};

// RTCPeerConnection: identifica un peer della connessione, tengo ugugale anche per file sharing
let pc;
// RTCDataChannel: identifica il canale attraverso il quale scambio dati etc
let dataChannel;

// Connessione al server Scaledrone per il processo di signaling
drone.on('open', error => {
    if (error) {
        return console.error(error);
    }
    room = drone.subscribe(roomName);
    room.on('open', error => {
        if (error) {
            return console.error(error);
        }
        console.log('Connected to signaling server');
    });
    //Connesso alla stanza
    room.on('members', members => {
        if (members.length >= 3) {
            return alert('The room is full');
        }
        //Se sono il secondo membro ad accedere alla stanza viene creatta l'offerta
        const isOfferer = members.length === 2;
        startWebRTC(isOfferer);
    });
});

//Invio dei segnali attraverso Scaledrone
function sendSignalingMessage(message) {
    drone.publish({
        room: roomName,
        message
    });
}

function startWebRTC(isOfferer) {
    console.log('Starting WebRTC in as', isOfferer ? 'offerer' : 'waiter');
    pc = new RTCPeerConnection(configuration);

    // 'onicecandidate' notifica quando un ICE vuole inviare un messaggio a un altro peer
    pc.onicecandidate = event => {
        if (event.candidate) {
            sendSignalingMessage({ 'candidate': event.candidate });
        }
    };


    if (isOfferer) {
        //Se l'utente è l'offerente avvia la negoziazione e crea il datachannel
        pc.onnegotiationneeded = () => {
            pc.createOffer(localDescCreated, error => console.error(error));
        }
        dataChannel = pc.createDataChannel('chat');
        setupDataChannel();
    } else {
        //Se l'utente non è l'offerente attende semplicemnete il datachannel
        pc.ondatachannel = event => {
            dataChannel = event.channel;
            setupDataChannel();
        }
    }

    startListentingToSignals();
}

function startListentingToSignals() {
    // In ascolto dei segnali provenienti da Scaledrone
    room.on('data', (message, client) => {
        if (client.id === drone.clientId) {
            return;
        }
        if (message.sdp) {
            // Chiamato quando ricevo domanda/risposta da un altro peer
            pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
                console.log('pc.remoteDescription.type', pc.remoteDescription.type);
                // Quando ricevo un offerta e le rispondo
                if (pc.remoteDescription.type === 'offer') {
                    console.log('Answering offer');
                    pc.createAnswer(localDescCreated, error => console.error(error));
                }
            }, error => console.error(error));
        } else if (message.candidate) {
            // Aggiungo un ICE alla descrizione di connessione remota
            pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    });
}

function localDescCreated(desc) {
    pc.setLocalDescription(
        desc,
        () => sendSignalingMessage({ 'sdp': pc.localDescription }),
        error => console.error(error)
    );
}

//Data channel event handlers
function setupDataChannel() {
    checkDataChannelState();
    dataChannel.onopen = checkDataChannelState;
    dataChannel.onclose = checkDataChannelState;
    dataChannel.onmessage = event =>
        insertMessageToDOM(JSON.parse(event.data), false)
}

function checkDataChannelState() {
    console.log('WebRTC channel state is:', dataChannel.readyState);
    if (dataChannel.readyState === 'open') {
        insertMessageToDOM({ content: 'Puoi iniziare a messaggiare!' });
    }
}

function insertMessageToDOM(options, isFromMe) {
    const template = document.querySelector('template[data-template="message"]');
    const nameEl = template.content.querySelector('.message__name');
    if (options.emoji || options.name) {
        nameEl.innerText = options.emoji + ' ' + options.name;
    }
    template.content.querySelector('.message__bubble').innerText = options.content;
    const clone = document.importNode(template.content, true);
    const messageEl = clone.querySelector('.message');
    if (isFromMe) {
        messageEl.classList.add('message--mine');
    } else {
        messageEl.classList.add('message--theirs');
    }

    const messagesEl = document.querySelector('.messages');
    messagesEl.appendChild(clone);
    messagesEl.scrollTop = messagesEl.scrollHeight - messagesEl.clientHeight;
}

const form = document.querySelector('.footer');
form.addEventListener('submit', () => {
    const input = document.querySelector('input[type="text"]');
    const value = input.value;
    input.value = '';

    const data = {
        content: value,

    };

    dataChannel.send(JSON.stringify(data));

    insertMessageToDOM(data, true);
});

insertMessageToDOM({ content: 'Registrati per iniziare a chattare!' });