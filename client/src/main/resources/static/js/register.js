//SCORPORARE ATTIVITA' DI REGISTRAZIONE

var registerName = null;
var registerState = null;
const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;

function setRegisterState(nextState) {
    switch (nextState) {
        case NOT_REGISTERED:
            enableButton('#register', 'register()');
            setCallState(DISABLED);
            break;
        case REGISTERING:
            disableButton('#register');
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


function disableButton(id) {
    $(id).attr('disabled', true);
    $(id).removeAttr('onclick');
}

function enableButton(id, functionName) {
    $(id).attr('disabled', false);
    $(id).attr('onclick', functionName);
}

window.onload = function() {
    //Metto solo roba che mi serve
    console = new Console();
    setRegisterState(NOT_REGISTERED);
    /*var drag = new Draggabilly(document.getElementById('videoSmall'));
    videoInput = document.getElementById('videoInput');
    videoOutput = document.getElementById('videoOutput');
    document.getElementById('name').focus();*/
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
            /*case 'callResponse':
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
        break;*/

            //QUESTO IN REALTA' NON SO SE SERVA NELLA REGISTRAZIONE
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
        document.getElementById('peer').focus();
    } else {
        setRegisterState(NOT_REGISTERED);
        var errorMessage = message.response ? message.response :
            'Unknown reason for register rejection.';
        console.log(errorMessage);
        document.getElementById('name').focus();
        alert('Error registering user. See console for further information.');
    }
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


/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox();
});
s