#Knockout.js + Node.js = What.js?

Recently I contributed a change to Knockout which allows it to run without hacks in a non-browser JavaScript environment. My original intention was to allow Knockout.js to be used with Titanium for the PropertyCross project however, a convenient side-effect is that it now also runs in Node. In this post I’ll run through what is and isn’t supported, and some ways you might want to use it.

##Getting Started

The changes are targeted for the 2.3.0 release which means the only way of working with them currently (official npm package [due soon](https://github.com/SteveSanderson/knockout/pull/866) is to checkout the project from GitHub and build it yourself, luckily this is a relatively painless experience if you have git setup -

```
git clone git://github.com/SteveSanderson/knockout.git
cd knockout
./build/build.sh
```

The output files are located in the build/output folder, knockout-latest-debug.js is the one you’ll want for Node, unless you have a strange compulsion for minified code! Let’s quickly put together a hello world example based on the example from the [Knockout website](http://knockoutjs.com/examples/helloWorld.html) -

```
var ko = require('build/output/knockout-latest.debug.js');

// Here's my data model
var ViewModel = function(first, last) {
  this.firstName = ko.observable(first);
  this.lastName = ko.observable(last);

  this.fullName = ko.computed(function() {
    // Knockout tracks dependencies automatically. It knows that fullName depends on firstName and lastName, because these get called when evaluating fullName.
    return this.firstName() + " " + this.lastName();
  }, this);
};

// create an instance of the ViewModel
var vm = new ViewModel('Planet', 'Earth');
// subscribe to fullName changes
var subscription = vm.fullName.subscribe(function(value) {
  console.log(value);
});
// log the current value
console.log(vm.fullName());
// trigger a change
vm.lastName('Mars');
// dispose of the subscription
subscription.dispose();
```

Sticking the above in a file (hello-world.js) in the root of the knockout project and then running it through Node (node hello-world.js) gives us -

```
Planet Earth
Planet Mars
```

So far so good but that’s a lot of boilerplate code, what’s happened to ko.applyBindings and the corresponding template? Well at this point it’s worth going back and reviewing the spec runner for Node to get a better idea of exactly which bits of Knockout are expected to work.

##What works? What doesn't?

The following table lists the test specs for Node, taken from spec/runner.node.js, against the Knockout methods they exercise -

```
arrayEditDetectionBehaviors - ko.utils.compareArrays(a, b)
asyncBehaviors - ko.observable().extend({ throttle: a })
dependentObservableBehaviors - ko.dependentObservable/computed()
expressionRewritingBehaviors - ko.expressionRewriting.*
extenderBehaviors - ko.extenders.*
mappingHelperBehaviors - ko.toJS, ko.toJSON
observableArrayBehaviors - ko.observableArray()
observableBehaviors - ko.observable()
subscribableBehaviors - ko.subscribable()
```

There’s a lot of observable related goodness there but glaring omissions around the DOM and templating functionality, which means no ko.applyBindings. However, taking a step back, you’ll probably have noticed that there isn’t much of a UI layer to Node, so even if those methods were there, what would they do?

Philosophy aside, where does this leave us? What can we do now that we couldn’t do previously?

##Faster view model testing

As long as your view models aren’t making any direct use of the DOM or templating functionality, then you can now run your test specs through Node instead of something like Phantom.js. Your milage will vary but in the case of the Knockout test cases, the Node test specs run in a quarter of the time (0.5s) of the Phantom test specs (2s). 

This isn’t a perfect example as the only a subset of the Phantom test specs are run by Node but in this case it does make enough of a difference to mean that the tests could now comfortably be run by a file-system watcher.

##Potential to integrate with non-browser, JavaScript powered UIs

This was my original aim when making these changes, in my case it was to re-use the view models from an HTML5 app in a Titanium app. I ended up hacking a fake DOM in to keep the old code happy but if I were to try it again now, I could just include vanilla Knockout.

As well as simply being able to use Knockout, I hope that these changes will encourage people to create their own templating system for the non-browser UI elements, which in turn will make it even easier to use Knockout.

##Crazy, pointless, Node-based view model fun!

Let's say we create a view model like this -

```
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
```

Then combine it with an npm module called johnny-five and a bit of view binding code -

```
var five = require("johnny-five");

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
```

Finally, attach an arduino and what do you get? 

[The worlds first KnightRider LED effect powered by a Knockout view model!](http://www.youtube.com/embed/OHQp_1wcFDU)
