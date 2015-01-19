//Interval id of the function that makes the engine tick and updates the display
var intervalId;
//Context canvas kept global for better performance
var context;
var GLOBAL = {
	//Size of each cell drawn in the canvas
	cellSize: 5
};

/**
 * Specialization of Agent that moves if it is not pleased with its neighbourhood.
 * @param {integer} x - Position in x dimension
 * @param {integer} y - Position in y dimension
 * @param {string} color - Color of the individual
 */
function Individual(x, y, color) {
	Agent.call(this, x, y, color);
}

Individual.prototype = Object.create(Agent.prototype);
Individual.prototype.constructor = Individual;

/**
 * Updates the position of the Individual by moving it if its satisfaction level is below the preference specified by the engine.
 * @param {Engine} engine - The engine that is running the simulation
 * @return {integer} - The level of satisfaction of the Individual
 */
Individual.prototype.update = function (engine) {
	if (!(engine instanceof Engine)) {
		throw new Error('engine must be of type Engine!');
	}
	var satisfaction = 0;
	var surroundings = getSurroundings(engine.grid, this.x, this.y);
	var individuals = 8 - surroundings.free.length;
	if (individuals === 0) {
		satisfaction = 100;
	} else {
		var similarIndividuals = 0;
		if (surroundings[this.color] && surroundings[this.color].length > 0) {
			similarIndividuals = surroundings[this.color].length;
		} else {
			similarIndividuals = 1;
		}
		satisfaction = Math.round(similarIndividuals / individuals * 100);
	}
	if (satisfaction < engine.preferences[this.color] && surroundings.free.length > 0) {
		var random = Math.floor(Math.random() * surroundings.free.length);
		var newCoords = surroundings.free[random];
		engine.grid[newCoords.x][newCoords.y] = this;
		engine.grid[this.x][this.y] = null; 
		this.x = newCoords.x;
		this.y = newCoords.y;
	}
	return satisfaction;
};
/**
 * An engine that simulates a loosely interpreted schelling model.
 * The constructor creates a grid, sets the level of preference,
 * instantiates the individuals with the right colors and randomly
 * places them on the grid.
 * @param {integer} width - The width of the grid
 * @param {integer} height - The height of the grid
 * @param {integer} preference - The level of preference
 * @param {integer} greens - The number of green individuals
 * @param {integer} reds - The number of red individuals
 */
function Schelling(width, height, drawingDiv, population, iterations) {
	if (typeof width !== 'number' || width <= 0) {
		throw new Error('width must be a number greater than 0');
	}
	if (typeof height !== 'number' || height <= 0) {
		throw new Error('height must be a number greater than 0');
	}
	Engine.call(this, width, height, drawingDiv);
	if (typeof population !== 'object' || Object.keys(population) < 2) {
		throw new Error('population must be an array describing at least two populations!');
	}
	if ((this.width * this.height) < totalPopulation) {
		throw new Error('The number of individuals is larger than the amount of space available!');
	}
	if (typeof iterations !== 'number' || iterations < 0) {
		throw new Error('The number of iterations must be a number greater than 0!');
	}
	var totalPopulation = 0;
	for (var pop in population) {
		if (population.hasOwnProperty(pop)) {
			if (!population[pop].hasOwnProperty('color') ||
				!population[pop].hasOwnProperty('size')  ||
				!population[pop].hasOwnProperty('preference')) {
				throw new Error('A population of individuals was not matching the expected format : ' + JSON.stringify(population[i]));
			}
			population[pop].size = parseInt(population[pop].size, 10);
			totalPopulation += population[pop].size;
		}
	}
	this.turns = 0;
	this.iterations = iterations;
	this.width = width;
	this.height = height;
	this.population = {};
	this.satisfaction = {};
	this.satisfactionSurvey = {};
	this.agents = [];
	this.preferences = {};
	for (var p in population) {
		if (population.hasOwnProperty(p)) {
			var pop = population[p];
			this.population[pop.color] = population[p];
			this.preferences[pop.color] = parseInt(population[p].preference, 10);
			this.satisfaction[pop.color] = 0;
			this.satisfactionSurvey[pop.color] = [];
		}
	}
	this.place();
}

Schelling.prototype = Object.create(Engine.prototype);
Schelling.prototype.constructor = Schelling;

/**
 * Creates the individuals according to the number given in the constructor
 * and places them on the grid.
 */
Schelling.prototype.place = function () {
	this.agents = [];
	for (var p in this.population) {
		if (this.population.hasOwnProperty(p)) {
			var pop = this.population[p];
			var i = 0, x, y;
			while (i < pop.size) {
				while (true) {
					x = Math.floor(Math.random() * this.width);
					y = Math.floor(Math.random() * this.height);
					if (!this.grid[x][y]) {
						this.grid[x][y] = new Individual(x, y, pop.color);
						this.agents.push(this.grid[x][y]);
						i++;
						break;
					}
				}
			}
		}
	}
};

/**
 * Simulates a turn of the simulation by updating every individual once in a random order.
 */
Schelling.prototype.tick = function () {
	this.turns++;
	this.agents = shuffle(this.agents);
	var i = this.agents.length - 1;
	while (i >= 0) {
		var agent = this.agents[i];
		var agentSatisfaction = agent.update(this);
		this.satisfaction[agent.color] += agentSatisfaction;
		i--;
	}
	for (var color in this.satisfaction) {
		if (this.satisfaction.hasOwnProperty(color)) {
			var colorSatisfactionAverage = Math.round(this.satisfaction[color] / this.population[color].size);
			this.satisfaction[color] = 0;
			this.satisfactionSurvey[color].push(colorSatisfactionAverage);
		}
	}
	if ((this.turns % this.iterations) === 0) {
		clearInterval(intervalId);
		console.log('Out after ' + this.satisfactionSurvey.length + ' turns');
		console.log('Average satisfaction : ' + this.satisfaction);
		this.plot();
	}
};

Schelling.prototype.plot = function () {
	var series = [];
	var length = 0;
	for (var color in this.satisfactionSurvey) {
		if (this.satisfactionSurvey.hasOwnProperty(color)) {
			length = this.satisfactionSurvey[color].length;
			series.push({name: color, data: this.satisfactionSurvey[color]});
		}
	}
	var categories = [];
	for (var i = 0; i < length; i++) {
		categories.push(i + 1);
	}
	$('#plot').highcharts({
        title: {
            text: 'Average satisfaction level',
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
            title: {
                text: '% of average satisfaction'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            valueSuffix: '%'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        'series': series
    });
};


function updateRange() {
	var id = this.id.split('.')[0] + '.output';
	document.getElementById(id).value = this.value + '%';
}

window.onload = function () {
	var settingsForm = document.getElementById('settings');
	settingsForm.onsubmit = function () {
		var x = parseInt(document.getElementById('x').value, 10);
		var y = parseInt(document.getElementById('y').value, 10);
		var iterations = parseInt(document.getElementById('iterations').value, 10);
		var demography = document.getElementsByClassName('population');
		var pop = {};
		for (var i = 0; i < demography.length; i++) {
			var element = demography[i];
			var id = element.id;
			var tokens = id.split('.');
			var group = tokens[0];
			var property = tokens[1];
			if (!pop.hasOwnProperty(group)) {
				pop[group] = {};
			}
			var value = element.value;
			pop[group][property] = value;
		}
		var engine = new Schelling(x, y, 'simulation', pop, iterations);
		var startButton = document.getElementById('startButton');
		startButton.onclick = function () {
			if (intervalId) {
				clearInterval(intervalId);
			}
			intervalId = setInterval(function () {
				engine.draw();
				engine.tick();
			}, 20);
			return false;
		};
		startButton.hidden = false;
		return false;
	};
	var redPreference = document.getElementById('red.preference');
	redPreference.onchange = updateRange;
	redPreference.onchange();
	var greenPreference = document.getElementById('green.preference');
	greenPreference.onchange = updateRange;
	greenPreference.onchange();
};