//Interval id of the function that makes the engine tick and updates the display
var intervalId;
//Context canvas kept global for better performance
var context;
var GLOBAL = {
	//Size of each cell drawn in the canvas
	cellSize: 5
};

/**
 * Abstract agent.
 * @param {integer} x - Position in x dimension
 * @param {integer} y - Position in y dimension
 */
function Agent(x, y) {
	this.x = x;
	this.y = y;
}

/**
 * Updates the state of the agent. Must be implemented by all objects subtyping Agent.
 * @param {Engine} engine - The engine that is running the simulation
 */
Agent.prototype.update = function (engine) {
	throw new Error('Abstract method must be implemented by subtype!');
};

/**
 * Specialization of Agent that moves if it is not pleased with its neighbourhood.
 * @param {integer} x - Position in x dimension
 * @param {integer} y - Position in y dimension
 * @param {string} color - Color of the individual
 */
function Individual(x, y, color) {
	Agent.call(this, x, y);
	this.color = color;
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
	var surroundings = getSurroundings(engine.grid, this.x, this.y);
	var denominator = 8 - surroundings.free.length;
	if (denominator === 0) {
		denominator = 1;
	}
	var similarIndividuals = surroundings[this.color] ? surroundings[this.color].length : 0;
	var agentSatisfaction = similarIndividuals / denominator * 100;
	if (agentSatisfaction < engine.preference && surroundings.free.length > 0) {
		var random = Math.floor(Math.random() * surroundings.free.length);
		var newCoords = surroundings.free[random];
		engine.grid[newCoords.x][newCoords.y] = this;
		engine.grid[this.x][this.y] = null; 
		this.x = newCoords.x;
		this.y = newCoords.y;
	}
	return agentSatisfaction;
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
function Engine(width, height, preference, population) {
	if (typeof width !== 'number' || width <= 0) {
		throw new Error('width must be a number greater than 0');
	}
	if (typeof height !== 'number' || height <= 0) {
		throw new Error('height must be a number greater than 0');
	}
	if (typeof preference !== 'number' || preference < 0 || preference > 100) {
		throw new Error('preference must be a number between 0 and 100!');
	}
	if (!(population instanceof Array) || population.length < 2) {
		throw new Error('population must be an array describing at least two populations!');
	}
	var totalPopulation = 0;
	for (var i = 0; i < population; i++) {
		if (!population[i].hasOwnProperty(color) || !population[i].hasOwnProperty(size)) {
			throw new Error('A population of individuals was not matching the expected format : ' + JSON.stringify(population[i]));
		}
		totalPopulation += population.size;
	}
	if ((this.width * this.height) < totalPopulation) {
		throw new Error('The number of individuals is larger than the amount of space available!');
	}
	
	this.width = width;
	this.height = height;
	this.preference = preference;
	this.population = population;
	this.satisfaction = 0;
	this.satisfactionSurvey = [];
	this.agents = [];

	
	this.grid = [];
	for (var i = 0; i < width; i++) {
		var column = [];
		for (var j = 0; j < height; j++) {
			column.push(null);
		}
		this.grid.push(column);
	}
	this.place();
}

/**
 * Creates the individuals according to the number given in the constructor
 * and places them on the grid.
 */
Engine.prototype.place = function () {
	this.agents = [];
	for (var j = 0; j < this.population.length; j++) {
		var pop = this.population[j];
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
};

/**
 * Simulates a turn of the simulation by updating every individual once in a random order.
 */
Engine.prototype.tick = function () {
	this.satisfaction = 0;
	//TODO: Shuffle the list of players
	this.agents = shuffle(this.agents);
	var i = this.agents.length - 1;
	while (i >= 0) {
		var agent = this.agents[i];
		var agentSatisfaction = agent.update(this);
		this.satisfaction += agentSatisfaction;
		i--;
	}
	if (this.agents.length !== 0) {
		this.satisfaction = Math.round(this.satisfaction / this.agents.length);
	} else {
		this.satisfaction = 0;
	}
	this.satisfactionSurvey.push([this.satisfactionSurvey.length, this.satisfaction]);
	if (this.satisfaction >= this.preference) {
		clearInterval(intervalId);
		console.log('Out after ' + this.satisfactionSurvey.length + ' turns');
		console.log('Average satisfaction : ' + this.satisfaction);
		this.plot();
	}
};

/**
 * Draws a representation of the grid in a HTML <canvas> element.
 * In order to draw the result, the page on which the code is executed
 * must contain a <div> with an id set to 'simulation'.
 */
Engine.prototype.draw = function () {
	var land = document.getElementById('surface');
	if (!land) {
		var land = document.createElement('canvas');
		land.width = GLOBAL.cellSize * this.width;
		land.height = GLOBAL.cellSize * this.height;
		context = land.getContext('2d');
		land.id = 'surface';
		document.getElementById('simulation').appendChild(land);
	}

	context.fillStyle = '#FFFFFF';
	context.fillRect(0, 0, land.width, land.height);
	var lastColor;

	for (var i = 0; i < this.width; i++) {
		var column = i * GLOBAL.cellSize;
		for (var j = 0; j < this.height; j++) {
			if (!this.grid[i][j] || !this.grid[i][j].color) {
				continue;
			}
			if (lastColor !== this.grid[i][j].color) {
				context.fillStyle = this.grid[i][j].color;
				lastColor = this.grid[i][j].color;
			}
			context.fillRect(column, j * GLOBAL.cellSize, GLOBAL.cellSize, GLOBAL.cellSize);
		}
	}
};

Engine.prototype.plot = function () {
	var categories = [];
	for (var i = 0; i < this.satisfactionSurvey.length; i++) {
		categories.push(i + 1);
	}
	var data = this.satisfactionSurvey;
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
        series: [{
            name: 'satisfaction',
            data: data
        }]
    });
};

/**
 * Returns an object containing the cells surronunding the cell at position (i, j).
 * The cells are classified according to their colour
 * @param {Array[Array]} - Two-dimensional array
 * @param {integer} i - Position in the first dimension
 * @param {integer} j - Position in the second dimension
 * @return {Object} - An object describing of the surroundings of cell (i, j)
 */
function getSurroundings(grid, i, j) {
	var surroundings = {
		'free': []
	};
	for (var k = -1; k <= 1; k++) {
		var x = i + k;
		if (x < 0) {
			x = grid.length - 1;
		} else if (x >= grid.length) {
			x = 0;
		}
		for (var l = -1; l <= 1; l++) {
			var y = j + l;
			if (y < 0) {
				y = grid[0].length - 1;
			} else if (y >= grid[0].length) {
				y = 0;
			}
			if (i === x && j === y) {
				continue;
			}
			var cell = {'x': x, 'y': y};
			if (grid[x][y] && grid[x][y].hasOwnProperty('color')) {
				var color = grid[x][y].color;
				if(!surroundings.hasOwnProperty(color)) {
					surroundings[color] = [];
				}
				surroundings[color].push(cell);
			} else {
				surroundings.free.push(cell);
			}
		}
	}
	return surroundings;
}

/**
 * Shuffles an array.
 * @param {Array} o - An array
 * @return The shuffled array
 */
function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

window.onload = function () {
	var population = [
		{
			'color': 'green',
			'size': 1100
		},
		{
			'color': 'red',
			'size': 1000
		},

		{
			'color': 'blue',
			'size': 800
		}
	];
	var engine = new Engine(100, 100, 75, population);
	document.getElementById('startButton').onclick = function () {
		intervalId = setInterval(function () {
			engine.draw();
			engine.tick();
		}, 20);
	};
};
