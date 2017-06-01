const CardReader = require('./cardreader');
const UtilityArduino = require('./util-arduino');

var requiredCards = [
    'f4:7c:7e:10',
    '54:ab:83:10',
    'f4:1d:8c:10',
    '24:61:84:10',
    '64:a9:f4:10',
    '34:f0:f7:10'
];
var requiredIdx = 0;
var state = 'READY';

var utilArduino = new UtilityArduino({
    portPath: '/dev/ttyACM0',
    portOpts: {
        baudRate: 115200
    }
});

var cardReader = new CardReader();
cardReader.on('cardScanned', data => {
    console.log('Read Card ID: ', data.uid, data.device);

    if (requiredIdx >= requiredCards.length) {
        console.log('Already done. Ignoring card');
        return;
    }

    if (data.uid === requiredCards[requiredIdx]) {
        console.log('Correct Card. Moving on');
        if (requiredIdx >= requiredCards.length - 1) {
            console.log('All Done');
            state = 'WAIT_FOR_BELL';
        }
        else {
            state = 'STAGE' + (requiredIdx + 1);
        }

        requiredIdx++;

        console.log('Current State: ', state);
    }
    else {
        console.log('Incorrect Card. Resetting');
        requiredIdx = 0;
        state = 'READY';
    }
});

cardReader.active = true;

utilArduino.on('bellPressed', () => {
    if (state !== 'WAIT_FOR_BELL') {
        console.log('Bell detected, but not ready. Ignoring');
        return;
    }

    state = 'COMPLETE';
    console.log('All Done. Waiting for game/board reset');
})
