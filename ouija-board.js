const SerialPort = require('serialport');
const EventEmitter = require('events');

function coords(x, y) {
    return {
        x: x,
        y: y
    }
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

class OuijaBoard extends EventEmitter {
    constructor(opts) {
        super();
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

    // re-home, and center
    reset() {
        this.progEval('$H');
        // TODO Fix?
        this.progEval('G90 G0 X280 Y115');

        // H E L L O
        this.progEval('G90 G0 X329 Y191');
        this.progEval('G4 P0.5');

        this.progEval('G90 G0 X247 Y191');
        this.progEval('G4 P0.5')

        this.progEval('G90 G0 X431 Y173');
        this.progEval('G4 P0.5');

        this.progEval('G90 G0 X431 Y200');
        this.progEval('G4 P0.25');

        this.progEval('G90 G0 X431 Y173');
        this.progEval('G4 P0.5');

        this.progEval('G90 G0 X158 Y108');
        this.progEval('G4 P2');

        this.progEval('G90 G0 X280 Y115');
    }

    showYes(lingerTime) {

    }

    showNo(lingerTime) {

    }
}

module.exports = OuijaBoard;