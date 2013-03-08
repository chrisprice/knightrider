var five = require("johnny-five"),
  viewModel = require('./knightrider-viewmodel.js');

new five.Board().on('ready', function() {
  [3, 5, 6, 9, 10, 11].forEach(function(pin, index) {
    var led = new five.Led(pin);
    viewModel.bars[index].subscribe(function(value) {
      led.brightness(Math.round(value * 255));
    });
  });

  setInterval(function() {
    viewModel.tick();
  }, 100);

});