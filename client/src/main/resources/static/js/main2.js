/*
text sharing
 */

'use strict';

let localConnection2;
let remoteConnection2;
let sendChannel2;
let receiveChannel2;
const dataChannelSend = document.querySelector('textarea#dataChannelSend');
const dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
const startButton = document.querySelector('button#startButton');
const sendButton = document.querySelector('button#sendButton');
const closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function enableStartButton() {
    startButton.disabled = false;
}

function disableSendButton() {
    sendButton.disabled = true;
}

function createConnection() {
    dataChannelSend.placeholder = '';
    const servers = null;
    window.localConnection2 = localConnection2 = new RTCPeerConnection(servers);
    console.log('Created local peer connection object localConnection');

    sendChannel2 = localConnection2.createDataChannel('sendDataChannel');
    console.log('Created send data channel');

    localConnection2.onicecandidate = e => {
        onIceCandidate(localConnection2, e);
    };
    sendChannel2.onopen = onSendChannelStateChange;
    sendChannel2.onclose = onSendChannelStateChange;

    window.remoteConnection2 = remoteConnection2 = new RTCPeerConnection(servers);
    console.log('Created remote peer connection object remoteConnection2');

    remoteConnection2.onicecandidate = e => {
        onIceCandidate(remoteConnection2, e);
    };
    remoteConnection2.ondatachannel = receiveChannelCallback;

    localConnection2.createOffer().then(
        gotDescription1,
        onCreateSessionDescriptionError
    );
    startButton.disabled = true;
    closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

function sendData() {
    const data = dataChannelSend.value;
    sendChannel2.send(data);
    console.log('Sent Data: ' + data);
}

function closeDataChannels() {
    console.log('Closing data channels');
    sendChannel2.close();
    console.log('Closed data channel with label: ' + sendChannel2.label);
    receiveChannel2.close();
    console.log('Closed data channel with label: ' + receiveChannel2.label);
    localConnection2.close();
    remoteConnection2.close();
    localConnection2 = null;
    remoteConnection2 = null;
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
    localConnection2.setLocalDescription(desc);
    console.log(`Offer from localConnection2\n${desc.sdp}`);
    remoteConnection2.setRemoteDescription(desc);
    remoteConnection2.createAnswer().then(
        gotDescription2,
        onCreateSessionDescriptionError
    );
}

function gotDescription2(desc) {
    remoteConnection2.setLocalDescription(desc);
    console.log(`Answer from remoteConnection2\n${desc.sdp}`);
    localConnection2.setRemoteDescription(desc);
}

function getOtherPc(pc) {
    return (pc === localConnection2) ? remoteConnection2 : localConnection2;
}

function getName(pc) {
    return (pc === localConnection2) ? 'localPeerConnection' : 'remotePeerConnection';
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

function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannel2 = event.channel;
    receiveChannel2.onmessage = onReceiveMessageCallback;
    receiveChannel2.onopen = onReceiveChannelStateChange;
    receiveChannel2.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
    console.log('Received Message');
    dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
    const readyState = sendChannel2.readyState;
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

function onReceiveChannelStateChange() {
    const readyState = receiveChannel2.readyState;
    console.log(`Receive channel state is: ${readyState}`);
}