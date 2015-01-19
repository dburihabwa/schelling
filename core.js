/**
 * Abstract agent.
 * @param {integer} x - Position in x dimension
 * @param {integer} y - Position in y dimension
 */
function Agent(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
}

/**
 * Updates the state of the agent. Must be implemented by all objects subtyping Agent.
 * @param {Engine} engine - The engine that is running the simulation
 */
Agent.prototype.update = function (engine) {
	throw new Error('Abstract method must be implemented by subtype!');
};

function Engine(width, height, drawingDiv) {
	this.width = width;
	this.height = height;
	this.drawingDiv = drawingDiv;
	this.grid = [];
	for (var i = 0; i < this.width; i++) {
		this.grid[i] = [];
		for (var j = 0; j < this.height; j++) {
			this.grid[i][j] = null;
		}
	}
}

/**
 * Simulates a turn of the simulation by updating every individual once in a random order.
 */
Engine.prototype.tick = function () {
	throw new Error('Abstract method must be implemented by subtype!');
};

/**
 * Draws a representation of the grid in a HTML <canvas> element.
 * In order to draw the result, the page on which the code is executed
 */
Engine.prototype.draw = function () {
	var canvas = document.getElementById('surface');
	if (!canvas) {
		var canvas = document.createElement('canvas');
		canvas.width = GLOBAL.cellSize * this.width;
		canvas.height = GLOBAL.cellSize * this.height;
		context = canvas.getContext('2d');
		canvas.id = 'surface';
		document.getElementById(this.drawingDiv).appendChild(canvas);
	}

	context.fillStyle = '#FFFFFF';
	context.fillRect(0, 0, canvas.width, canvas.height);
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
}