var connection = new RTCMultiConnection();

connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
connection.socketMessageEvent = 'canvas-designer';

connection.enableFileSharing = false;
connection.session = {
    audio: true,
    video: true,
    data: true
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};
connection.dontCaptureUserMedia = true;
if (location.hash.replace('#', '').length) {
    var roomid = location.hash.replace('#', '');
    connection.join(roomid);
}

connection.onUserStatusChanged = function(event) {
    var infoBar = document.getElementById('hide-on-datachannel-opened');
    if (event.status == 'online') {
        infoBar.innerHTML = event.userid + ' is <b>online</b>.';
    }

    if (event.status == 'offline') {
        infoBar.innerHTML = event.userid + ' is <b>offline</b>.';
    }

    numberOfConnectedUsers.innerHTML = connection.getAllParticipants().length;
};

var numberOfConnectedUsers = document.getElementById('number-of-connected-users');
connection.onopen = function(event) {
    var infoBar = document.getElementById('hide-on-datachannel-opened');
    infoBar.innerHTML = '<b>' + event.userid + '</b> is ready to collaborate with you.';

    if (designer.pointsLength <= 0) {
        // make sure that remote user gets all drawings synced.
        setTimeout(function() {
            connection.send('plz-sync-points');
        }, 1000);
    }

    numberOfConnectedUsers.innerHTML = connection.getAllParticipants().length;

    if (connection.isInitiator) {
        setTimeout(function() {
            designer.renderStream();
        }, 1000);
    }
};

connection.onclose = connection.onerror = connection.onleave = function() {
    numberOfConnectedUsers.innerHTML = connection.getAllParticipants().length;
};

connection.onmessage = function(event) {
    if (event.data === 'plz-sync-points') {
        designer.sync();
        return;
    }

    designer.syncData(event.data);
};

/*ATTACCO ROBA CHAT*/

const chatHash = location.hash.substring(1);
const drone = new ScaleDrone('yiS12Ts5RdNhebyM');
const configuration = {
    iceServers: [{
        url: 'stun:stun.l.google.com:19302'
    }]
};

let pc;
// RTCDataChannel: identifica il canale attraverso il quale scambio dati etc
let dataChannel;

drone.on('open', error => {
    if (error) {
        return console.error(error);
    }
    room = drone.subscribe(roomid);
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
        room: roomId,
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

insertMessageToDOM({ content: 'Registrati e contatta un utente per iniziare a chattare!' });