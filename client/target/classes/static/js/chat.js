/* Javascript per la chat
 */

'use strict';

let localConnectionForChat;
let remoteConnectionForChat;
let sendChannelForChat;
let receiveChannelForChat;
const dataChannelSend = document.querySelector('textarea#dataChannelSend');
const dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
const startButton = document.querySelector('button#startButton');
const sendButton = document.querySelector('button#sendButton');
const closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection2;
sendButton.onclick = sendData2;
closeButton.onclick = closeDataChannels2;

function enableStartButton() {
    startButton.disabled = false;
}

function disableSendButton() {
    sendButton.disabled = true;
}

function createConnection2() {
    dataChannelSend.placeholder = '';
    const servers = null;
    window.localConnectionForChat = localConnectionForChat = new RTCPeerConnection(servers);
    console.log('Created local peer connection object localConnection');

    sendChannelForChat = localConnectionForChat.createDataChannel('sendDataChannel');
    console.log('Created send data channel');

    localConnectionForChat.onicecandidate = e => {
        onIceCandidate(localConnectionForChat, e);
    };
    sendChannelForChat.onopen = onSendChannelStateChange2;
    sendChannelForChat.onclose = onSendChannelStateChange2;

    window.remoteConnectionForChat = remoteConnectionForChat = new RTCPeerConnection(servers);
    console.log('Created remote peer connection object remoteConnectionForChat');

    remoteConnectionForChat.onicecandidate = e => {
        onIceCandidate(remoteConnectionForChat, e);
    };
    remoteConnectionForChat.ondatachannel = receiveChannelCallback2;

    localConnectionForChat.createOffer().then(
        gotDescription1,
        onCreateSessionDescriptionError
    );
    startButton.disabled = true;
    closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

function sendData2() {
    const data = dataChannelSend.value;
    sendChannelForChat.send(data);
    console.log('Sent Data: ' + data);
}

function closeDataChannels2() {
    console.log('Closing data channels');
    sendChannelForChat.close();
    console.log('Closed data channel with label: ' + sendChannelForChat.label);
    receiveChannelForChat.close();
    console.log('Closed data channel with label: ' + receiveChannelForChat.label);
    localConnectionForChat.close();
    remoteConnectionForChat.close();
    localConnectionForChat = null;
    remoteConnectionForChat = null;
    console.log('Closed peer connections');
    startButton.disabled = false;
    sendButton.disabled = true;
    closeButton.disabled = true;
    dataChannelSend.value = '';
    dataChannelReceive.value = '';
    dataChannelSend.disabled = true;
    disableSendButton();
    enableStartButton();
}

function gotDescription1(desc) {
    localConnectionForChat.setLocalDescription(desc);
    console.log(`Offer from localConnectionForChat\n${desc.sdp}`);
    remoteConnectionForChat.setRemoteDescription(desc);
    remoteConnectionForChat.createAnswer().then(
        gotDescription2,
        onCreateSessionDescriptionError
    );
}

function gotDescription2(desc) {
    remoteConnectionForChat.setLocalDescription(desc);
    console.log(`Answer from remoteConnectionForChat\n${desc.sdp}`);
    localConnectionForChat.setRemoteDescription(desc);
}

function getOtherPc(pc) {
    return (pc === localConnectionForChat) ? remoteConnectionForChat : localConnectionForChat;
}

function getName(pc) {
    return (pc === localConnectionForChat) ? 'localPeerConnection' : 'remotePeerConnection';
}

function onIceCandidate(pc, event) {
    getOtherPc(pc)
        .addIceCandidate(event.candidate)
        .then(
            () => onAddIceCandidateSuccess(pc),
            err => onAddIceCandidateError(pc, err)
        );
    console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
    console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
    console.log(`Failed to add Ice Candidate: ${error.toString()}`);
}

function receiveChannelCallback2(event) {
    console.log('Receive Channel Callback');
    receiveChannelForChat = event.channel;
    receiveChannelForChat.onmessage = onReceiveMessageCallback2;
    receiveChannelForChat.onopen = onReceiveChannelStateChange2;
    receiveChannelForChat.onclose = onReceiveChannelStateChange2;
}

function onReceiveMessageCallback2(event) {
    console.log('Received Message');
    dataChannelReceive.value = event.data;
}

function onSendChannelStateChange2() {
    const readyState = sendChannelForChat.readyState;
    console.log('Send channel state is: ' + readyState);
    if (readyState === 'open') {
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        sendButton.disabled = false;
        closeButton.disabled = false;
    } else {
        dataChannelSend.disabled = true;
        sendButton.disabled = true;
        closeButton.disabled = true;
    }
}

function onReceiveChannelStateChange2() {
    const readyState = receiveChannelForChat.readyState;
    console.log(`Receive channel state is: ${readyState}`);
}