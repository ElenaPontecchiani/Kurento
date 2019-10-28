function onOpenRoom() {
    // capture canvas-2d stream
    // and share in realtime using RTCPeerConnection.addStream
    // requires: dev/webrtc-handler.js
    designer.captureStream(function(stream) {
        connection.attachStreams = [stream];
        connection.onstream({
            stream: stream
        });
    });
}