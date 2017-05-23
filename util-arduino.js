const SerialPort = require('serialport');
const EventEmitter = require('events');

class UtilityArduino extends EventEmitter {
    constructor(opts) {
        super();
        this.port = new SerialPort(opts.portPath, opts.portOpts);
        this.isReady = false;

        this.bellPressed = false;

        this.port.on('open', () => {
            this.isReady = true;
            this.port.flush();

            console.log('Utility Arduino is ready');

            this.port.on('data', data => {
                var procData = data.toString().trim();
                
                // Only get bell data
                var currBellStatus = (procData === '1');
                if (currBellStatus != this.bellPressed) {
                    if (currBellStatus) {
                        this.emit('bellPressed');
                    }
                    else {
                        this.emit('bellReleased');
                    }

                    this.bellPressed = currBellStatus;
                }


            });
        });
    }
}

module.exports = UtilityArduino;
