//settaggio bottoni per navbar
const registerButton = document.querySelector('a#registerButton');
const callButton = document.querySelector('a#callButton');


registerButton.onclick = registerPage;
callButton.onclick = callPage;










var ws = new WebSocket('wss://' + location.host + '/call');
var videoInput;
var videoOutput;
var webRtcPeer;
var from;

//VARIABILI REGISTRAZIONE 
var registerName = null;
var registerState = null;
const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;

function setRegisterState(nextState) {
    switch (nextState) {
        case NOT_REGISTERED:
            enableButton('#register', 'register()');
            disableButton('#skills_button');
            setCallState(DISABLED);
            break;
        case REGISTERING:
            disableButton('#register');
            disableButton('#call');
            enableButton('#skills_button', 'skills()');
            break;
        case REGISTERED:
            disableButton('#register');
            setCallState(NO_CALL);
            break;
        default:
            return;
    }
    registerState = nextState;
}

//VARIABILI CHIAMATA 
var callState = null;
const NO_CALL = 0;
const IN_CALL = 1;
const POST_CALL = 2;
const DISABLED = 3;
const IN_PLAY = 4;

function setCallState(nextState) {
    switch (nextState) {
        case NO_CALL:
            enableButton('#call', 'call()');
            disableButton('#terminate');
            disableButton('#play');
            break;
        case DISABLED:
            disableButton('#call');
            disableButton('#terminate');
            disableButton('#play');
            break;
        case POST_CALL:
            enableButton('#call', 'call()');
            disableButton('#terminate');
            enableButton('#play', 'play()');
            break;
        case IN_CALL:
        case IN_PLAY:
            disableButton('#call');
            enableButton('#terminate', 'stop()');
            disableButton('#play');
            break;
        default:
            return;
    }
    callState = nextState;
}

//VARIABILI SKILLS 
var skillsState = null;
const NO_SKILLS = 0;
const YES_SKILLS = 1;

function setSkillsState(nextState) {
    switch (nextState) {
        case NO_SKILLS:
            enableButton('#skills_button', 'skills()');
            disableButton('#call');
            disableButton('#terminate');
            disableButton('#play');
            break;
        case YES_SKILLS:
            enableButton('#call', 'call()');
            disableButton('#terminate');
            enableButton('#play', 'play()');
            break;
        default:
            return;
    }
    skillsState = nextState;
}



function disableButton(id) {
    $(id).attr('disabled', true);
    $(id).removeAttr('onclick');
}

function enableButton(id, functionName) {
    $(id).attr('disabled', false);
    $(id).attr('onclick', functionName);
}

window.onload = function() {
    console = new Console();
    setRegisterState(NOT_REGISTERED);
    var drag = new Draggabilly(document.getElementById('videoSmall'));
    videoInput = document.getElementById('videoInput');
    videoOutput = document.getElementById('videoOutput');
    document.getElementById('name').focus();
}

window.onbeforeunload = function() {
    ws.close();
}

ws.onmessage = function(message) {
    var parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (parsedMessage.id) {
        case 'registerResponse':
            registerResponse(parsedMessage);
            break;
        case 'callResponse':
            callResponse(parsedMessage);
            break;
        case 'incomingCall':
            incomingCall(parsedMessage);
            break;
        case 'startCommunication':
            startCommunication(parsedMessage);
            break;
        case 'stopCommunication':
            console.info('Communication ended by remote peer');
            stop(true);
            break;
        case 'playResponse':
            playResponse(parsedMessage);
            break;
        case 'playEnd':
            playEnd();
            break;
        case 'iceCandidate':
            webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
                if (error)
                    return console.error('Error adding candidate: ' + error);
            });
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
}

function registerResponse(message) {
    if (message.response == 'accepted') {
        setRegisterState(REGISTERED);
        document.getElementById('skills').focus();
        console.log(window.location);
    } else {
        setRegisterState(NOT_REGISTERED);
        var errorMessage = message.response ? message.response :
            'Unknown reason for register rejection.';
        console.log(errorMessage);
        document.getElementById('name').focus();
        alert('Error registering user. See console for further information.');
    }
}

function callResponse(message) {
    if (message.response != 'accepted') {
        console.info('Call not accepted by peer. Closing call');
        stop();
        setCallState(NO_CALL);
        if (message.message) {
            alert(message.message);
        }
    } else {
        setCallState(IN_CALL);
        webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
            if (error)
                return console.error(error);
        });
    }
}

function startCommunication(message) {
    setCallState(IN_CALL);
    webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
        if (error)
            return console.error(error);
    });
}

function playResponse(message) {
    if (message.response != 'accepted') {
        hideSpinner(videoOutput);
        document.getElementById('videoSmall').style.display = 'block';
        alert(message.error);
        document.getElementById('peer').focus();
        setCallState(POST_CALL);
    } else {
        setCallState(IN_PLAY);
        webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
            if (error)
                return console.error(error);
        });
    }
}

function incomingCall(message) {
    // If bussy just reject without disturbing user
    if (callState != NO_CALL && callState != POST_CALL) {
        var response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'bussy'
        };
        return sendMessage(response);
    }

    setCallState(DISABLED);
    if (confirm('User ' + message.from +
            ' is calling you. Do you accept the call?')) {
        showSpinner(videoInput, videoOutput);

        from = message.from;
        var options = {
            localVideo: videoInput,
            remoteVideo: videoOutput,
            onicecandidate: onIceCandidate
        }
        webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
            function(error) {
                if (error) {
                    return console.error(error);
                }
                this.generateOffer(onOfferIncomingCall);
            });
    } else {
        var response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'user declined'
        };
        sendMessage(response);
        stop();
    }
}

function onOfferIncomingCall(error, offerSdp) {
    if (error)
        return console.error('Error generating the offer ' + error);
    var response = {
        id: 'incomingCallResponse',
        from: from,
        callResponse: 'accept',
        sdpOffer: offerSdp
    };
    sendMessage(response);
}

function register() {
    var name = document.getElementById('name').value;
    if (name == '') {
        window.alert('You must insert your user name');
        document.getElementById('name').focus();
        return;
    }
    setRegisterState(REGISTERING);

    var message = {
        id: 'register',
        name: name
    };
    sendMessage(message);
}

function call() {
    if (document.getElementById('peer').value == '') {
        document.getElementById('peer').focus();
        window.alert('You must specify the peer name');
        return;
    }
    setCallState(DISABLED);
    showSpinner(videoInput, videoOutput);

    var options = {
        localVideo: videoInput,
        remoteVideo: videoOutput,
        onicecandidate: onIceCandidate
    }
    webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
        function(error) {
            if (error) {
                return console.error(error);
            }
            this.generateOffer(onOfferCall);
        });
}

function onOfferCall(error, offerSdp) {
    if (error)
        return console.error('Error generating the offer ' + error);
    console.log('Invoking SDP offer callback function');
    var message = {
        id: 'call',
        from: document.getElementById('name').value,
        to: document.getElementById('peer').value,
        sdpOffer: offerSdp
    };
    sendMessage(message);
}

function play() {
    var peer = document.getElementById('peer').value;
    if (peer == '') {
        window
            .alert("You must insert the name of the user recording to be played (field 'Peer')");
        document.getElementById('peer').focus();
        return;
    }

    document.getElementById('videoSmall').style.display = 'none';
    setCallState(DISABLED);
    showSpinner(videoOutput);

    var options = {
        remoteVideo: videoOutput,
        onicecandidate: onIceCandidate
    }
    webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error) {
            if (error) {
                return console.error(error);
            }
            this.generateOffer(onOfferPlay);
        });
}

function onOfferPlay(error, offerSdp) {
    console.log('Invoking SDP offer callback function');
    var message = {
        id: 'play',
        user: document.getElementById('peer').value,
        sdpOffer: offerSdp
    };
    sendMessage(message);
}

function playEnd() {
    setCallState(POST_CALL);
    hideSpinner(videoInput, videoOutput);
    document.getElementById('videoSmall').style.display = 'block';
}

function stop(message) {
    var stopMessageId = (callState == IN_CALL) ? 'stop' : 'stopPlay';
    setCallState(POST_CALL);
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;

        if (!message) {
            var message = {
                id: stopMessageId
            }
            sendMessage(message);
        }
    }
    hideSpinner(videoInput, videoOutput);
    document.getElementById('videoSmall').style.display = 'block';
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function onIceCandidate(candidate) {
    console.log('Local candidate ' + JSON.stringify(candidate));

    var message = {
        id: 'onIceCandidate',
        candidate: candidate
    };
    sendMessage(message);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox();
});


function registerPage() { //funzione che fa display solo della parte di registrazione
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("low_container");
    intro.style.display = "none";
    register.style.display = "block";
    video.style.display = "none";
    file.style.display = "none";
    chat.style.display = "none";







}


function callPage() { //funzione che fa display solo della parte di call
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("low_container");
    intro.style.display = "none";
    register.style.display = "none";
    video.style.display = "block";
    file.style.display = "none";
    chat.style.display = "none";
}


function filePage() { //funzione che fa display solo della parte di file sharing
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("low_container");
    intro.style.display = "none";
    register.style.display = "none";
    video.style.display = "none";
    file.style.display = "block";
    chat.style.display = "none";
}

function chatPage() { //funzione che fa display solo della parte di chat
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("low_container");
    intro.style.display = "none";
    register.style.display = "none";
    video.style.display = "none";
    file.style.display = "none";
    chat.style.display = "block";
}

function helpPage() { //funzione che fa display solo della parte di registrazione
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("low_container");
    intro.style.display = "block";
    register.style.display = "none";
    video.style.display = "none";
    file.style.display = "none";
    chat.style.display = "none";
}