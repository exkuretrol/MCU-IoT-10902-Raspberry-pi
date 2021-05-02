var Gpio = require('onoff').Gpio//include onoff to interact with the GPIO
var LED = new Gpio(4, 'out')
var blinkInterval = setInterval(blinkLED, 250) //run the blinkLED functionevery 250ms

function blinkLED() { //function to start blinking
    if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or

        LED.writeSync(1);//set pin state to 1 (turn LED

    } else {

        LED.writeSync(0);

    }
}
function endBlink() { //function to stop blinking

    clearInterval(blinkInterval); // Stop blink intervals
    LED.writeSync(0); // Turn LED off
    LED.unexport(); // Unexport GPIO to free res ources

}
setTimeout(endBlink, 5000) //stop blinking after 5 seconds