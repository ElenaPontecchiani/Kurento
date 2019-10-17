//FILE JAVASCRIPT CON LE UTILITY GENERALI CHE SERVONO PER TUTTE LE PAGINE

//Funzioni per caricamento pagine
function registerPage() { //funzione che fa display solo della parte di registrazione
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("content1");
    intro.style.display = "none";
    register.style.display = "block";
    video.style.display = "none";
    file.style.display = "none";
}


function callPage() { //funzione che fa display solo della parte di call
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("content1");
    intro.style.display = "none";
    register.style.display = "none";
    video.style.display = "block";
    file.style.display = "none";
}


function filePage() { //funzione che fa display solo della parte di file sharing
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("content1");
    intro.style.display = "none";
    register.style.display = "none";
    video.style.display = "none";
    file.style.display = "block";
}

function chatPage() { //funzione che fa display solo della parte di chat
    var intro = document.getElementById("intro");
    var register = document.getElementById("registerForm");
    var video = document.getElementById("videocall");
    var file = document.getElementById("file");
    var chat = document.getElementById("content1");
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
    var chat = document.getElementById("content1");
    intro.style.display = "block";
    register.style.display = "none";
    video.style.display = "none";
    file.style.display = "none";
}