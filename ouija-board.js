let spec = {
steppers: [{W1: 'M1', W2: 'M2'}, {W1: 'M3', W2: 'M4'}],
    address: 0x60
};

var X_MIN_SWITCH = 27; // BCM 16
var X_MAX_SWITCH = 24; // BCM 19
var Y_MIN_SWITCH = 28; // BCM 20
var Y_MAX_SWITCH = 29; // BCM 21

var motorHat = require('motor-hat')(spec);
var wpi = require('wiring-pi');

wpi.setup('wpi');

// Set up the switch inputs
wpi.pinMode(X_MIN_SWITCH, wpi.INPUT);
wpi.pinMode(X_MAX_SWITCH, wpi.INPUT);
wpi.pinMode(Y_MIN_SWITCH, wpi.INPUT);
wpi.pinMode(Y_MAX_SWITCH, wpi.INPUT);

wpi.pullUpDnControl(X_MIN_SWITCH, wpi.PUD_DOWN);
wpi.pullUpDnControl(X_MAX_SWITCH, wpi.PUD_DOWN);
wpi.pullUpDnControl(Y_MIN_SWITCH, wpi.PUD_DOWN);
wpi.pullUpDnControl(Y_MAX_SWITCH, wpi.PUD_DOWN);

console.log('Board Initialized');

return {};
