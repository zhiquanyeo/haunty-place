const SerialPort = require('serialport');
const EventEmitter = require('events');

function coords(x, y) {
    return {
        x: x,
        y: y
    }
}

const TEXT_WHITELIST = /[^A-Z0-9,\.]/gi;
const Y_FUDGE_FACTOR = 3; // mm
const X_FUDGE_FACTOR = 3; // mm

const CHAR_ROW = {
    'A': 0,
    'B': 0,
    'C': 0,
    'D': 0,
    'E': 0,
    'F': 0,
    'G': 0,
    'H': 0,
    'I': 0,
    'J': 0,
    'K': 0,
    'L': 0,
    'M': 0,
    'N': 1,
    'O': 1,
    'P': 1,
    'Q': 1,
    'R': 1,
    'S': 1,
    'T': 1,
    'U': 1,
    'V': 1,
    'W': 1,
    'X': 1,
    'Y': 1,
    'Z': 1,

    '1': 2,
    '2': 2,
    '3': 2,
    '4': 2,
    '5': 2,
    '6': 2,
    '7': 2,
    '8': 2,
    '9': 2,
    '0': 2,
}

const CHAR_LOCATIONS = {
    'A': coords(128, 151),
    'B': coords(163, 171),
    'C': coords(190, 174),
    'D': coords(217, 191),
    'E': coords(247, 191),
    'F': coords(274, 191),
    'G': coords(290, 191),
    'H': coords(329, 191),
    'I': coords(355, 191),
    'J': coords(372, 187),
    'K': coords(406, 173),
    'L': coords(431, 173),
    'M': null, // Too close to edge
    'N': coords(139, 100),
    'O': coords(162, 113),
    'P': coords(180, 133),
    'Q': coords(206, 137),
    'R': coords(233, 150),
    'S': coords(274, 150),
    'T': coords(297, 150),
    'U': coords(326, 150),
    'V': coords(350, 150),
    'W': coords(378, 136),
    'X': coords(414, 133),
    'Y': coords(443, 119),
    'Z': null, // Too close to edge
    '1': coords(186, 70),
    '2': coords(207, 70),
    '3': coords(231, 70),
    '4': coords(259, 70),
    '5': coords(284, 70),
    '6': coords(315, 70),
    '7': coords(339, 70),
    '8': coords(364, 70),
    '9': coords(392, 70),
    '0': coords(419, 70),
};

const SPECIAL_LOCATIONS = {
    BOARD_CENTER: coords(280, 115),
    YES: coords(181, 251),
    NO: coords(421, 251),
    BYE: coords(271, 40)
};

const CHAR_DURATION = 0.5;
const COMMA_DURATION = 1.0;
const PERIOD_DURATION = 2.0;
const WORD_DURATION = 1.5;

class OuijaBoard extends EventEmitter {
    constructor(opts) {
        super();
        try {
            this.port = new SerialPort(opts.portPath, opts.portOpts);
            this.isReady = false;
            this.queue = [];
            this._sending = false;

            this.port.on('open', () => {
                this.isReady = true;
                this.port.flush();

                this.port.on('data', (data) => {
                    console.log('data: ', data.toString());
                    // TODO emit serial log event to server
                    this.emit('serialReceive', data);
                    this.dequeue();
                });

                this.port.on('error', (err) => {
                    console.log(err);
                    this.emit('serialError', err);
                });

                this.port.on('close', () => {
                    console.log('port closed... badness');
                });

                this.emit('ready');
            });
        }
        catch (e) {
            console.error('OOPS Something went horribly wrong with the board');
        }
    }

    dequeue() {
        var cmd = this.queue.shift();
        if (!cmd) {
            return;
        }

        console.log('sending: ', cmd);

        this._sending = true;
        this.port.write(cmd, (err) => {
            if (err) {
                console.log(err);
            }
            this._sending = false;
        })
    }

    eval(cmd, withNewLine) {
        if (!withNewLine) {
            cmd = cmd.slice(1, -2) + '\n';
        }
        this.queue.push(cmd);

        this.emit('serialInput', cmd);

        if (!this._sending) {
            this.dequeue();
        }
    }

    progEval(cmd) {
        this.eval(cmd + '\n', true);
    }

    // High level move commands
    moveToCenter() {
        this.moveToLocation(SPECIAL_LOCATIONS.BOARD_CENTER);
    }

    moveToYes() {
        this.moveToLocation(SPECIAL_LOCATIONS.YES);
    }

    moveToNo() {
        this.moveToLocation(SPECIAL_LOCATIONS.NO);
    }

    moveToBye() {
        this.moveToLocation(SPECIAL_LOCATIONS.BYE);
    }

    moveToChar(ch) {
        if (!CHAR_LOCATIONS[ch]) {
            console.warn('Unknown character');
            return;
        }
        this.moveToLocation(CHAR_LOCATIONS[ch]);
    }



    // G-Code generation
    moveToLocation(coords) {
        var gcStr = 'G90 G0 X' + coords.x + ' Y' + coords.y;
        this.progEval(gcStr);
    }

    pauseFor(secs) {
        var gcStr = 'G4 P' + secs;
        this.progEval(gcStr);
    }

    // re-home, and center
    reset() {
        this.progEval('$H');
        // Move to center of board after reset
        this.progEval('G90 G0 X280 Y115');

        this.emit('reset');
    }

    // all times in seconds
    showYes(lingerTime) {
        this.emit('moveTo', {
            type: 'special',
            location: 'YES'
        });
        
        this.moveToYes();
        this.pauseFor(lingerTime);
        this.moveToCenter();
    }

    showNo(lingerTime) {
        this.emit('moveTo', {
            type: 'special',
            location: 'NO'
        });
        
        this.moveToNo();
        this.pauseFor(lingerTime);
        this.moveToCenter();
    }

    showBye(lingerTime) {
        this.emit('moveTo', {
            type: 'special',
            location: 'BYE'
        });

        this.moveToBye();
        this.pauseFor(lingerTime);
        this.moveToCenter();
    }

    spell(sentence) {
        // convert to upper case first
        sentence = sentence.toUpperCase().trim();
        var words = sentence.split(/\s+/);

        for (var i = 0; i < words.length; i++) {
            this.spellWord(words[i]);
        }

        // Pause for effect, then move to center
        this.pauseFor(2.0);
        this.moveToCenter();
    }

    spellWord(word) {
        // TODO Handle same letters in a row?
        // TODO adjust fudge factor when moving?
        word = word.replace(TEXT_WHITELIST, '');
        for (var i = 0; i < word.length; i++) {
            var ch = word.charAt(i);
            var chCoords = CHAR_LOCATIONS[ch];

            if (chCoords) {
                // It's a character
                this.moveToChar(ch);
                this.pauseFor(CHAR_DURATION);
                this.emit('moveTo', {
                    type: 'character',
                    character: ch
                });
            }
            else if (ch === ',') {
                this.pauseFor(COMMA_DURATION);
                this.emit('pause', {
                    type: 'comma',
                    duration: COMMA_DURATION
                });
            }
            else if (ch === '.') {
                this.pauseFor(PERIOD_DURATION);
                this.emit('pause', {
                    type: 'period',
                    duration: PERIOD_DURATION
                });
            }
        }
    }
}

module.exports = OuijaBoard;