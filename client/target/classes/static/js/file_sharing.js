/* javascript per il file sharing  */
'use strict';

//SETTAGGIO VARIABILI GLOBALI
//Bottoni
const abortButton = document.querySelector('button#abortButton');
const sendFileButton = document.querySelector('button#sendFile');


let localConnectionForFileSharing;
let remoteConnectionForFileSharing;
let sendChannelForFileSharing;
let receiveChannelForFileSharing;
let fileReader;
const bitrateDiv = document.querySelector('div#bitrate');
const fileInput = document.querySelector('input#fileInput');
const downloadAnchor = document.querySelector('a#download');
const sendProgress = document.querySelector('progress#sendProgress');
const receiveProgress = document.querySelector('progress#receiveProgress');
const statusMessage = document.querySelector('span#status');


let receiveBuffer = [];
let receivedSize = 0;

let bytesPrev = 0;
let timestampPrev = 0;
let timestampStart;
let statsInterval = null;
let bitrateMax = 0;

sendFileButton.addEventListener('click', () => createConnection());
fileInput.addEventListener('change', handleFileInputChange, false);
abortButton.addEventListener('click', () => {
    if (fileReader && fileReader.readyState === 1) {
        console.log('Abort read!');
        fileReader.abort();
    }
});

async function handleFileInputChange() {
    let file = fileInput.files[0];
    if (!file) {
        console.log('No file chosen');
    } else {
        sendFileButton.disabled = false;
    }
}

async function createConnection() {
    abortButton.disabled = false;
    sendFileButton.disabled = true;
    localConnectionForFileSharing = new RTCPeerConnection();
    console.log('Created local peer connection object localConnectionForFileSharing');

    sendChannelForFileSharing = localConnectionForFileSharing.createDataChannel('sendDataChannel');
    sendChannelForFileSharing.binaryType = 'arraybuffer';
    console.log('Created send data channel');

    sendChannelForFileSharing.addEventListener('open', onSendChannelStateChange);
    sendChannelForFileSharing.addEventListener('close', onSendChannelStateChange);
    sendChannelForFileSharing.addEventListener('error', error => console.error('Error in sendChannel:', error));

    localConnectionForFileSharing.addEventListener('icecandidate', async event => {
        console.log('Local ICE candidate: ', event.candidate);
        await remoteConnectionForFileSharing.addIceCandidate(event.candidate);
    });

    remoteConnectionForFileSharing = new RTCPeerConnection();
    console.log('Created remote peer connection object remoteConnectionForFileSharing');

    remoteConnectionForFileSharing.addEventListener('icecandidate', async event => {
        console.log('Remote ICE candidate: ', event.candidate);
        await localConnectionForFileSharing.addIceCandidate(event.candidate);
    });
    remoteConnectionForFileSharing.addEventListener('datachannel', receiveChannelCallback);

    try {
        const offer = await localConnectionForFileSharing.createOffer();
        await gotLocalDescription(offer);
    } catch (e) {
        console.log('Failed to create session description: ', e);
    }

    fileInput.disabled = true;
}

function sendData() {
    const file = fileInput.files[0];
    console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);

    // Handle 0 size files.
    statusMessage.textContent = '';
    downloadAnchor.textContent = '';
    if (file.size === 0) {
        bitrateDiv.innerHTML = '';
        statusMessage.textContent = 'File is empty, please select a non-empty file';
        closeDataChannels();
        return;
    }
    sendProgress.max = file.size;
    receiveProgress.max = file.size;
    const chunkSize = 16384;
    fileReader = new FileReader();
    let offset = 0;
    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', e => {
        console.log('FileRead.onload ', e);
        sendChannelForFileSharing.send(e.target.result);
        offset += e.target.result.byteLength;
        sendProgress.value = offset;
        if (offset < file.size) {
            readSlice(offset);
        }
    });
    const readSlice = o => {
        console.log('readSlice ', o);
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
}

function closeDataChannels() {
    console.log('Closing data channels');
    sendChannelForFileSharing.close();
    console.log(`Closed data channel with label: ${sendChannelForFileSharing.label}`);
    if (receiveChannelForFileSharing) {
        receiveChannelForFileSharing.close();
        console.log(`Closed data channel with label: ${receiveChannelForFileSharing.label}`);
    }
    localConnectionForFileSharing.close();
    remoteConnectionForFileSharing.close();
    localConnectionForFileSharing = null;
    remoteConnectionForFileSharing = null;
    console.log('Closed peer connections');

    // re-enable the file select
    fileInput.disabled = false;
    abortButton.disabled = true;
    sendFileButton.disabled = false;
}

async function gotLocalDescription(desc) {
    await localConnectionForFileSharing.setLocalDescription(desc);
    console.log(`Offer from localConnectionForFileSharing\n ${desc.sdp}`);
    await remoteConnectionForFileSharing.setRemoteDescription(desc);
    try {
        const answer = await remoteConnectionForFileSharing.createAnswer();
        await gotRemoteDescription(answer);
    } catch (e) {
        console.log('Failed to create session description: ', e);
    }
}

async function gotRemoteDescription(desc) {
    await remoteConnectionForFileSharing.setLocalDescription(desc);
    console.log(`Answer from remoteConnectionForFileSharing\n ${desc.sdp}`);
    await localConnectionForFileSharing.setRemoteDescription(desc);
}

function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannelForFileSharing = event.channel;
    receiveChannelForFileSharing.binaryType = 'arraybuffer';
    receiveChannelForFileSharing.onmessage = onReceiveMessageCallback;
    receiveChannelForFileSharing.onopen = onReceiveChannelStateChange;
    receiveChannelForFileSharing.onclose = onReceiveChannelStateChange;

    receivedSize = 0;
    bitrateMax = 0;
    downloadAnchor.textContent = '';
    downloadAnchor.removeAttribute('download');
    if (downloadAnchor.href) {
        URL.revokeObjectURL(downloadAnchor.href);
        downloadAnchor.removeAttribute('href');
    }
}

function onReceiveMessageCallback(event) {
    console.log(`Received Message ${event.data.byteLength}`);
    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;

    receiveProgress.value = receivedSize;

    // we are assuming that our signaling protocol told
    // about the expected file size (and name, hash, etc).
    const file = fileInput.files[0];
    if (receivedSize === file.size) {
        const received = new Blob(receiveBuffer);
        receiveBuffer = [];

        downloadAnchor.href = URL.createObjectURL(received);
        downloadAnchor.download = file.name;
        downloadAnchor.textContent =
            `Click to download '${file.name}' (${file.size} bytes)`;
        downloadAnchor.style.display = 'block';

        const bitrate = Math.round(receivedSize * 8 /
            ((new Date()).getTime() - timestampStart));
        bitrateDiv.innerHTML = `<strong>Average Bitrate:</strong> ${bitrate} kbits/sec (max: ${bitrateMax} kbits/sec)`;

        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }

        closeDataChannels();
    }
}

function onSendChannelStateChange() {
    const readyState = sendChannelForFileSharing.readyState;
    console.log(`Send channel state is: ${readyState}`);
    if (readyState === 'open') {
        sendData();
    }
}

async function onReceiveChannelStateChange() {
    const readyState = receiveChannelForFileSharing.readyState;
    console.log(`Receive channel state is: ${readyState}`);
    if (readyState === 'open') {
        timestampStart = (new Date()).getTime();
        timestampPrev = timestampStart;
        statsInterval = setInterval(displayStats, 500);
        await displayStats();
    }
}

// display bitrate statistics.
async function displayStats() {
    if (remoteConnectionForFileSharing && remoteConnectionForFileSharing.iceConnectionState === 'connected') {
        const stats = await remoteConnectionForFileSharing.getStats();
        let activeCandidatePair;
        stats.forEach(report => {
            if (report.type === 'transport') {
                activeCandidatePair = stats.get(report.selectedCandidatePairId);
            }
        });
        if (activeCandidatePair) {
            if (timestampPrev === activeCandidatePair.timestamp) {
                return;
            }
            // calculate current bitrate
            const bytesNow = activeCandidatePair.bytesReceived;
            const bitrate = Math.round((bytesNow - bytesPrev) * 8 /
                (activeCandidatePair.timestamp - timestampPrev));
            bitrateDiv.innerHTML = `<strong>Current Bitrate:</strong> ${bitrate} kbits/sec`;
            timestampPrev = activeCandidatePair.timestamp;
            bytesPrev = bytesNow;
            if (bitrate > bitrateMax) {
                bitrateMax = bitrate;
            }
        }
    }
}