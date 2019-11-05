//CANVAS DESIGNER
var designer = new CanvasDesigner();

designer.widgetHtmlURL = 'https://51a07e50-50f7-4935-9397-1b6f138f005d.htmlpasta.com'; //quello mio che va

designer.widgetJsURL = 'https://www.webrtc-experiment.com/Canvas-Designer/widget.js';



designer.addSyncListener(function(data) {
    connection.send(data);
});

designer.setSelected('pencil');
designer.appendTo(document.getElementById('canvas_container'));

//UNDO
var undoOptions = document.getElementById('undo-options');



undoOptions.onclick = undoOptions.onchange;

if (localStorage.getItem('undo-options')) {
    undoOptions.value = localStorage.getItem('undo-options');
    undoOptions.onchange();
}

document.getElementById('btn-undo').onclick = function() {
    if (undoOptions.value === 'Pulisci tutta la lavagna') {
        designer.undo('all');
    } else if (undoOptions.value === 'Last Shape') {
        designer.undo(-1);
    }
};


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

        linkToImage.href = dataURL;
        linkToImage.innerHTML = 'Download';
        linkToImage.download = 'image.' + (format || 'image/png').split('/')[1];

        callback(dataURL, format);
    });
}


//LINK IMAGE/DOWNLOAD
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
};