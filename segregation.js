var intervalId;

function Agent(x, y) {
	this.x = x;
	this.y = y;
}

Agent.prototype.update = function (engine) {
	throw new Error('Abstract method must be implemented by subtype!');
};

function Individual(x, y, color) {
	Agent.call(this, x, y);
	this.color = color;
}

Individual.prototype = Object.create(Agent.prototype);
Individual.prototype.constructor = Individual;

Individual.prototype.update = function (engine) {
	if (!(engine instanceof Engine)) {
		throw new Error('engine must be of type Engine!');
	}
	var surroundings = getSurroundings(engine.grid, this.x, this.y);
	var color = this.color + 's';
	var denominator = surroundings.greens.length + surroundings.reds.length;
	if (denominator === 0) {
		denominator = 1;
	}
	var agentSatisfaction = (surroundings[color].length / denominator * 100);
	if (agentSatisfaction < engine.preference && surroundings.free.length > 0) {
		console.log('individual (' + this.x + ', ' + this.y + ') wants to move out');
		var random = Math.floor(Math.random() * surroundings.free.length);
		var newCoords = surroundings.free[random];
		engine.grid[newCoords.x][newCoords.y] = this;
		engine.grid[this.x][this.y] = null; 
		this.x = newCoords.x;
		this.y = newCoords.y;
	}
	return agentSatisfaction;
};

function Engine(width, height, preference, greens, reds) {
	if (typeof width !== 'number' || width <= 0) {
		throw new Error('width must be a number greater than 0');
	}
	if (typeof height !== 'number' || height <= 0) {
		throw new Error('height must be a number greater than 0');
	}
	if (typeof preference !== 'number' || preference < 0 || preference > 100) {
		throw new Error('preference must be a number between 0 and 100!');
	}
	if (typeof greens !== 'number' || greens < 0) {
		throw new Error('greens must be a number greater or equal to 0');
	}
	if (typeof reds !== 'number' || reds < 0) {
		throw new Error('reds must be a number greater or equal to 0');
	}
	if ((this.width * this.height) < (greens + reds)) {
		throw new Error('The number of individuals is larger than the amount of space available!');
	}
	
	this.width = width;
	this.height = height;
	this.preference = preference;
	this.greens = greens;
	this.reds = reds;
	this.satisfaction = 0;
	this.satisfactionSurvey = [];
	
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

Engine.prototype.place = function () {
	var i = 0, x, y;
	while (i < this.greens) {
		while (true) {
			x = Math.floor(Math.random() * this.width);
			y = Math.floor(Math.random() * this.height);
			if (!this.grid[x][y]) {
				this.grid[x][y] = new Individual(x, y, 'green');
				i++;
				break;
			}
		}
	}
	i = 0;
	while (i < this.reds) {
		while (true) {
			x = Math.floor(Math.random() * this.width);
			y = Math.floor(Math.random() * this.height);
			if (!this.grid[x][y]) {
				this.grid[x][y] = new Individual(x, y, 'red');
				i++;
				break;
			}
		}
	}
};

Engine.prototype.tick = function () {
	this.satisfaction = 0;
	var individuals = 0;
	var agents = [];
	for (var i = 0; i < this.width; i++) {
		for (var j = 0; j < this.height; j++) {
			var agent = this.grid[i][j];
			if (!agent) {
				continue;
			}
			agents.push(agent);
		}
	}
	//TODO: Shuffle the list of players
	individuals = agents.length;
	while (agents.length > 0) {
		var agent = agents.pop();
		var agentSatisfaction = agent.update(this);
		this.satisfaction += agentSatisfaction;
	}
	if (individuals !== 0) {
		this.satisfaction = Math.round(this.satisfaction / individuals);		
	} else {
		this.satisfaction = 0;
	}
	this.satisfactionSurvey.push([this.satisfactionSurvey.length, this.satisfaction]);
	if (this.satisfaction >= this.preference) {
		clearInterval(intervalId);
		console.log('Out after ' + this.satisfactionSurvey.length + ' turns');
	}
	console.log('Preference : ' + this.preference);
};

Engine.prototype.draw = function () {
	var land = document.getElementById('land');
	if (!land) {
		land = document.createElement('table');
		land.id = 'land';
		for (var i = 0; i < this.width; i++) {
			var row = document.createElement('tr');
			for (var j = 0; j < this.height; j++) {
				var cell = document.createElement('td');
				cell.id = i + 'x' + j;
				row.appendChild(cell);
			}
			land.appendChild(row);
		}
		document.getElementById('simulation').appendChild(land);
	}

	for (var i = 0; i < this.width; i++) {
		for (var j = 0; j < this.height; j++) {
			var cell = document.getElementById(i + 'x' + j);
			if (!this.grid[i][j]) {
				cell.className = 'void';
			} else if (this.grid[i][j].color) {
				var color = this.grid[i][j].color;
				cell.className = color;
			} else {
				cell.className = '';
				console.error('could not associate any type with cell(' + i + ', ' + j + ')');
			}
		}
	}
};

function getSurroundings(grid, i, j) {
	var surroundings = {
		'reds': [],
		'greens': [],
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
			var cell = {'x': x, 'y': y};
			if (!grid[x][y]) {
				surroundings.free.push(cell);				
			} else if (grid[x][y].color === 'red') {
				surroundings.reds.push(cell);
			} else if (grid[x][y].color === 'green') {
				surroundings.greens.push(cell);
			}
		}
	}
	return surroundings;
}


window.onload = function () {
	var populations = [
		{
			'name': 'red',
			'population': 100,
		},
		{
			'name': 'green',
			'population': 100,
		}
	];
	var engine = new Engine(100, 100, 74, 4000, 4000);
	document.getElementById('startButton').onclick = function () {
		intervalId = setInterval(function () {
			engine.draw();
			engine.tick();
		}, 50);
	};
};