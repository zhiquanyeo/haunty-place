var Board = require('./ouija-board');

var board = new Board({
    portPath: 'COM3',
    portOpts: {
        baudRate: 115200
    }
});

board.on('ready', () => {
    console.log('ready');

    setTimeout(() => {
        board.reset();

    }, 3000);
});