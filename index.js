const Board = require('./ouija-board');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const CardReader = require('./cardreader');
const UtilityArduino = require('./util-arduino');

var PUBLIC_HTML_DIR = __dirname + '/public_html';

var board = new Board({
    portPath: 'COM3',
    portOpts: {
        baudRate: 115200
    }
});

board.on('ready', () => {
    
    setTimeout(() => {
        console.log('ready');
        board.reset();

    }, 3000);
});

var cardReader = new CardReader();

var utilArduino = new UtilityArduino({
    portPath: '/dev/ttyACM0',
    portOpts: {
        baudRate: 115200
    }
});

app.use(express.static('public_html'));
app.get('/', (req, res) => {
    res.sendFile(PUBLIC_HTML_DIR + '/index.html');
});

// Game State Machine
var requiredCards = [1, 2, 3, 4, 5, 6];
var requiredIdx = 0;
var state = 'READY';

var dingInterval = null;

function setState(newState) {
    state = newState;
    io.emit('gameState', state);
}

io.on('connection', (socket) => {
    console.log('Socket connected');
    socket.emit('gameState', state);

    socket.on('centerPlanchette', () => {
        board.moveToCenter();
    });

    socket.on('showYes', () => {
        board.showYes(1);
    });

    socket.on('showNo', () => {
        board.showNo(1);
    });

    socket.on('showBye', () => {
        board.showBye(5);
    });

    socket.on('spellText', (text) => {
        board.spell(text);
    });

    socket.on('resetGame', () => {
        console.log('Requested to reset game');
        requiredIdx = 0;
        setState('READY');
    })

    // DEBUG
    socket.on('demoCard', (cardNum) => {
        console.log('Got Card: ', cardNum);
        if (requiredIdx >= requiredCards.length) {
            console.log('Already done. Ignoring card');
            return;
        }

        if (cardNum === requiredCards[requiredIdx]) {
            console.log('Correct Card. Moving on');
            board.showYes(1);
            
            if (requiredIdx >= requiredCards.length - 1) {
                console.log('All done.');
                setState('WAIT_FOR_BELL');
                dingInterval = setInterval(() => {
                    console.log('Sending Ding');
                    board.spell('ding');
                }, 15000);
            }
            else {
                setState('STAGE' + (requiredIdx + 1));
            }
            
            requiredIdx++;
        }
        else {
            console.log('Incorrect Card. Resetting');
            requiredIdx = 0;
            setState('ERROR');

            board.showNo(1);
            board.showBye(3);
            console.log('Reset complete');
            setState('READY');
        }
    });

    socket.on('bellPressed', () => {
        if (state !== 'WAIT_FOR_BELL') {
            console.log('Bell detected but not ready. Ignoring');
        }
        else {
            if (dingInterval) {
                clearInterval(dingInterval);
            }
            
            setState('COMPLETE');
            console.log('All Done. Waiting for game/board reset');
            board.showBye(2);
        }
    })
});

utilArduino.on('bellPressed', () => {
    if (state !== 'WAIT_FOR_BELL') {
        console.log('Bell detected, but not ready. Ignoring');
    }
    else {
        if (dingInterval) {
            clearInterval(dingInterval);
        }

        setState('COMPLETE');
        console.log('All Done. Waiting for game/board reset');
        board.showBye(2);
    }
});

// Hook up board events
board.on('reset', () => {
    console.log('Board was reset');
    io.emit('lastEvent', {
        type: 'reset'
    });
    io.emit('boardReset');
});

board.on('moveTo', (e) => {
    io.emit('lastEvent', {
        type: 'moveTo',
        moveType: e
    });
});

board.on('pause', (e) => {
    io.emit('lastEvent', {
        type: 'pause',
        pauseType: e
    });
});

cardReader.on('cardScanned', data => {
    console.log('Read card ID: ', data.uid);
    
    if (requiredIdx >= requiredCards.length) {
        console.log('Already done. Ignoring card');
        return;
    }

    if (data.uid === requiredCards[requiredIdx]) {
        console.log('Correct card. Moving on');
        
        board.showYes(1);
        
        if (requiredIdx >= requiredCards.length - 1) {
            console.log('All Done.');
            setState('WAIT_FOR_BELL');
            dingInterval = setInterval(() => {
                console.log('Sending ding');
                board.spell('ding');
            }, 15000);
        }
        else {
            setState('STAGE' + (requiredIdx + 1));
        }

        requiredIdx++;
    }
    else {
        console.log('Incorrect Card. Resetting');

        requiredIdx = 0;
        setState('ERROR');

        board.showNo(1);
        board.showBye(3);
        console.log('RESET COMPLETE');
        setState('READY');
    }
});

http.listen(3000, () => {
    console.log('Web Server listening on *:3000');
})
