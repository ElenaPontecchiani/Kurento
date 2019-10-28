document.getElementById('room-id').onkeyup = document.getElementById('room-id').onblur = function() {
    localStorage.setItem('canvas-designer-roomid', this.value);
};

if (localStorage.getItem('canvas-designer-roomid')) {
    document.getElementById('room-id').value = localStorage.getItem('canvas-designer-roomid');
}

document.getElementById('open-room').onclick = function() {
    var roomid = document.getElementById('room-id').value;
    if (!roomid.length) return alert('Please enter roomid.');

    this.disabled = true;

    connection.open(roomid, onOpenRoom);
    //forse da cambiare questo, provare a inserire un p dove setto tx
    this.parentNode.innerHTML = '<a href="#' + roomid + '" target="_blank">Please share this link</a>';
};