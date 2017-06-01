const nfc = require('nfc').nfc;
const EventEmitter = require('events');

class CardReader extends EventEmitter {
    constructor() {
        super();
        this.d_device = new nfc.NFC();
        this.d_active = false;
        this.d_lastUID = null;
        
        this.d_device.on('read', tag => {
            if (this.d_active && tag.uid !== this.d_lastUID) {
                this.emit('cardScanned', {
                    uid: tag.uid
                });
            }

            this.d_lastUID = tag.uid;
            console.log('tag read: ', tag.uid);
        });

        this.d_device.start();
    }

    set active(value) {
        this.d_active = !!value;
    }

    get active() {
        return this.d_active;
    }

    reset() {
        this.d_lastUID = null;
    }
}

module.exports = CardReader;
