var ko = require('./knockout-latest.debug.js');

var viewModel = {
  ticks: ko.observable(0),
  tick: function() {
    this.ticks(this.ticks() + 1);
  },
  bars: []
};

function createBar(index, count) {
  return ko.computed(function() {
    var a = viewModel.ticks() % ((count - 1) * 2);
    var b = Math.abs(a - count + 1);
    var c = Math.abs(index - b);
    var d = c / count;
    var e = 1 - d;
    return (e * e * e).toFixed(3);
  });
}

for (var index = 0, count = 6; index < count; index++) {
  viewModel.bars[index] = createBar(index, count);
}

module.exports = viewModel;