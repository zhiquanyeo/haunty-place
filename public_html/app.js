window.addEventListener('load', function () {

var socket = io();

var currStateLabel = document.getElementById('boardState');
var prevCommandLabel = document.getElementById('lastCommand');

// Manual Controls
var fullResetButton = document.getElementById('btnFullReset');
var boardResetButton = document.getElementById('btnResetBoard');
var gameResetButton = document.getElementById('btnResetGame');

var centerPointerButton = document.getElementById('btnCenterPlanchette');

var yesButton = document.getElementById('btnShowYes');
var noButton = document.getElementById('btnShowNo');
var byeButton = document.getElementById('btnShowBye');

var textButton = document.getElementById('btnShowText');
var manualTextEntry = document.getElementById('txtManualText');

// State 
var boardState = 'UNK'; // UNK, IDLE(?), ACTIVE
var gameState = 'UNK'; // UNK, START, ERROR, STAGE1, STAGE2, STAGE3, STAGE4, STAGE5, STAGE6, SUCCESS

// Events from server
socket.on('boardReset', function () {
    boardState = 'ACTIVE';
});

socket.on('gameReady', function () {
    gameState = 'START';
});

socket.on('gameState', function(state) {
    gameState = state;
    currStateLabel.innerHTML = state;
});

// Page event handlers
fullResetButton.addEventListener('click', function () {
    socket.emit('fullReset');
    boardState = 'UNK';
    gameState = 'UNK';
});

boardResetButton.addEventListener('click', function () {
    socket.emit('resetBoard');
    boardState = 'UNK';
});

gameResetButton.addEventListener('click', function () {
    socket.emit('resetGame');
    gameState = 'UNK';
});

centerPointerButton.addEventListener('click', function () {
    socket.emit('centerPlanchette');
});

yesButton.addEventListener('click', function () {
    socket.emit('showYes');
});

noButton.addEventListener('click', function () {
    socket.emit('showNo');
});

byeButton.addEventListener('click', function () {
    socket.emit('showBye');
});

textButton.addEventListener('click', function () {
    socket.emit('spellText', manualTextEntry.value);
});

// Set up the fake cards
[1,2,3,4,5,6].forEach(function (cardNum) {
    var btn = document.getElementById('btnCard' + cardNum);
    btn.addEventListener('click', function() {
        socket.emit('demoCard', cardNum);
    });
})

var errCard = document.getElementById('btnCardError');
errCard.addEventListener('click', function () {
    socket.emit('demoCard', -1);
});

var bellBtn = document.getElementById('btnBell');
bellBtn.addEventListener('click', function () {
    socket.emit('bellPressed');
});

});