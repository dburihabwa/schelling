# schelling

A loosely interpreted version of Schelling's segregation model.

## Requirements

* A modern web browser with javascript enabled (other than IE 10)

## Run

Load index.html in a web browser and tweak the settings in the form.
Once you have specified the settings for your simulation, click on the start button.

The simulation will then start running for the number of iterations you chose.
At the end of the simulation, a chart will be drawn below the simulation screen displaying the level of satisfaction of each population over time.

## Implementation
The schelling engine relies on the core engine (defined in core.js).
The core engine already has functions to randomly ask each agent to run once on each turn and to render the state of the simulation.
You can pass function to the engine's tick method in order to gather results when every agents updates itself or at the end of the turn.
```javascript
var engine = new Engine(width, heigth, simulationDiv);
var onUpdate = function (agent) {};//Called when an agent has been updated
var onCompletion = function () {};//Called when all agents have been updated
engine.tick(onUpdate, onCompletion);
```   

It only implements an extra function to plot the results of the simulation when the number of iterations set in the form is reached.