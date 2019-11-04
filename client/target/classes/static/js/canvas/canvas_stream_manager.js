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


































var undoOptions = document.getElementById('undo-options');

document.getElementById('btn-display-undo-popup').onclick = function() {
    document.getElementById('light').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
};

var txtNumberOfShapesToUndo = document.getElementById('number-of-shapes-to-undo');
txtNumberOfShapesToUndo.onkeyup = function() {
    localStorage.setItem('number-of-shapes-to-undo', txtNumberOfShapesToUndo.value);
}

if (localStorage.getItem('number-of-shapes-to-undo')) {
    txtNumberOfShapesToUndo.value = localStorage.getItem('number-of-shapes-to-undo');
    txtNumberOfShapesToUndo.onkeyup();
}

undoOptions.onchange = function() {
    txtNumberOfShapesToUndo.parentNode.style.display = 'none';

    if (undoOptions.value === 'Specific Range') {
        //
    } else if (undoOptions.value === 'Last Multiple') {
        txtNumberOfShapesToUndo.parentNode.style.display = 'block';
    }

    localStorage.setItem('undo-options', undoOptions.value);
};

undoOptions.onclick = undoOptions.onchange;

if (localStorage.getItem('undo-options')) {
    undoOptions.value = localStorage.getItem('undo-options');
    undoOptions.onchange();
}

document.getElementById('btn-undo').onclick = function() {
    if (undoOptions.value === 'All Shapes') {
        designer.undo('all');
    } else if (undoOptions.value === 'Specific Range') {
        designer.undo({
            specificRange: {
                start: -1,
                end: -1
            }
        });
    } else if (undoOptions.value === 'Last Shape') {
        designer.undo(-1);
    } else if (undoOptions.value === 'Last Multiple') {
        var numberOfLastShapes = txtNumberOfShapesToUndo.value;
        numberOfLastShapes = parseInt(numberOfLastShapes || 0) || 0;
        designer.undo({
            numberOfLastShapes: numberOfLastShapes
        });
    }

    closeUndoPopup();
};

function closeUndoPopup() {
    document.getElementById('light').style.display = 'none';
    document.getElementById('fade').style.display = 'none';

    undoOptions.onchange();
}
document.getElementById('btn-close-undo-popup').onclick = closeUndoPopup;

function closeDataURLPopup() {
    document.getElementById('dataURL-popup').style.display = 'none';
    document.getElementById('fade').style.display = 'none';

    dataURLFormat.onchange();
}
document.getElementById('btn-close-dataURL-popup').onclick = closeDataURLPopup;

document.getElementById('export-as-image').onclick = function() {
    linkToImage.innerHTML = linkToImage.href = linkToImage.style = '';

    document.getElementById('dataURL-popup').style.display = 'block';
    document.getElementById('fade').style.display = 'block';

    getDataURL();
};

function getDataURL(callback) {
    callback = callback || function() {};
    var format = dataURLFormat.value;
    designer.toDataURL(format || 'image/png', function(dataURL) {
        linkToImage.style = 'margin-left: 10px;display: block;text-align: center;margin-bottom: -50px;';
        linkToImage.href = dataURL;
        linkToImage.innerHTML = 'Click to Download Image';
        linkToImage.download = 'image.' + (format || 'image/png').split('/')[1];

        callback(dataURL, format);
    });
}

var dataURLFormat = document.getElementById('data-url-format');
var linkToImage = document.getElementById('link-to-image');

dataURLFormat.onchange = function() {
    localStorage.setItem('data-url-format', dataURLFormat.value);
    getDataURL();
};
dataURLFormat.onclick = dataURLFormat.onchange;

if (localStorage.getItem('data-url-format')) {
    dataURLFormat.value = localStorage.getItem('data-url-format');
    dataURLFormat.onchange();
}

document.getElementById('btn-getDataURL').onclick = function() {
    getDataURL(function(dataURL, format) {
        window.open(dataURL);
    });

    // closeDataURLPopup();
};

document.getElementById('btn-close-comments-popup').onclick = function() {
    document.getElementById('comments-popup').style.display = 'none';
    document.getElementById('fade').style.display = 'none';

    dataURLFormat.onchange();
};

function showCommentsPopup(e) {
    document.getElementById('comments-popup').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}
document.getElementById('btn-comments').onclick = showCommentsPopup;
if (location.hash.length && location.hash.indexOf('comment') !== -1) {
    showCommentsPopup();
}