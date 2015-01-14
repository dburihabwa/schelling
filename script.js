var intervalId = null;
var turns = 0;

function Agent(x, y, gestation) {
	this.id = Math.ceil(Math.random() * 10000);
	this.x = x;
	this.y = y;
	this.gestation = gestation;
	this.age = 0;
}

Agent.prototype.update = function (grid, surroundings) {
	this.age++;
	this.gestation--;
};

function Shark(x, y, starvation) {
	Agent.call(this, x, y, 10);
	this.starvation = starvation;
}

Shark.prototype = Object.create(Agent.prototype);
Shark.prototype.constructor = Shark;

Shark.prototype.update = function (grid, surroundings) {
	var next, coord, length;
	if (this.gestation === 0) {
		this.gestation = 10;
		if (surroundings.free.length > 0) {
			length = surroundings.free.length;
			next = Math.floor(Math.random() * length);
			coord = {
				x: surroundings.free[next].x,
				y: surroundings.free[next].y
			};
			grid.table[coord.x][coord.y] = new Shark(coord.x, coord.y);
			surroundings.free.splice(next, 1);
			grid.sharks++;
		}
	}
	if (surroundings.tunas.length !== 0) {
		length = surroundings.tunas.length;
		next = Math.floor(Math.random() * length);
		coord = {
			x: surroundings.tunas[next].x,
			y: surroundings.tunas[next].y
		};
		grid.table[coord.x][coord.y] = this;
		grid.table[this.x][this.y] = null;
		this.starvation = 3;
		this.x = coord.x;
		this.y = coord.y;
		grid.tunas--;
	} else if (!this.starvation || this.starvation <= 0) {
		grid.table[this.x][this.y] = null;
		grid.sharks--;
		return;
	} else if (surroundings.free.length !== 0) {
		length = surroundings.free.length;
		next = Math.floor(Math.random() * length);
		coord = {
			x: surroundings.free[next].x,
			y: surroundings.free[next].y
		};
		grid.table[coord.x][coord.y] = grid.table[this.x][this.y];
		grid.table[this.x][this.y] = null;
		this.starvation--;
		this.x = coord.x;
		this.y = coord.y;
	} else {
		this.starvation--;
	}
	Agent.prototype.update.apply(this, grid, surroundings);
};

function Tuna(x, y) {
	Agent.call(this, x, y, 3);
}

Tuna.prototype = Object.create(Agent.prototype);
Tuna.prototype.constructor = Tuna;

Tuna.prototype.update = function (grid, surroundings) {
	var coord, next;
	if (this.gestation === 0) {
		this.gestation = 3;
		if (surroundings.free.length > 0) {
			var length = surroundings.free.length;
			next = Math.floor(Math.random() * length);
			coord = {
				x: surroundings.free[next].x,
				y: surroundings.free[next].y
			};
			grid.table[coord.x][coord.y] = new Tuna(coord.x, coord.y);
			surroundings.free.splice(next, 1);
			grid.tunas++;
		}
	}
	if (surroundings.free.length !== 0) {
		var length = surroundings.free.length;
		next = Math.floor(Math.random() * length);
		coord = {
			x: surroundings.free[next].x,
			y: surroundings.free[next].y
		};
		grid.table[coord.x][coord.y] = this;
		grid.table[this.x][this.y] = null;
		this.x = coord.x;
		this.y = coord.y;
	}
	Agent.prototype.update.apply(this, grid, surroundings);
};

function Grid(width, height, sharks, tunas) {
	this.width = width;
	this.height = height;
	this.sharks = sharks;
	this.tunas = tunas;
	this.table = [];
	for (var i = 0; i < this.width; i++) {
		this.table[i] = [];
		for (var j = 0; j < this.height; j++) {
			this.table[i][j] = null;
		}
	}
}

Grid.prototype.drawGrid = function () {
	var table = document.getElementById('sea');
	if (!table) {
		var body = document.getElementById('simulation');
		table = document.createElement('table');
		table.id = 'sea';
		for (var i = 0; i < this.table.length; i++) {
			var row = document.createElement('tr');
			for (var j = 0; j < this.table[i].length; j++) {
				var cell = document.createElement('td');
				cell.id = i + 'x' + j;
				row.appendChild(cell);
			}
			table.appendChild(row);
		}
		body.appendChild(table);
	}
	for (var i = 0; i < this.table.length; i++) {
		var row = document.createElement('tr');
		for (var j = 0; j < this.table[i].length; j++) {
			var cell = document.getElementById(i + 'x' + j);
			if (this.table[i][j] instanceof Shark) {
				cell.className = 'shark';
			} else if (this.table[i][j] instanceof Tuna) {
				cell.className = 'tuna';
			} else {
				cell.className = 'water';
			}
		}
	}
};


function Engine(width, height, sharks, tunas) {
	this.grid = new Grid(width, height, sharks, tunas);
	this.population = [];
	this.ratio = [];
	this.age = {};
	var i, j;
	while (tunas > 0) {
		while (true) {
			i = Math.floor(Math.random() * width);
			j = Math.floor(Math.random() * height);
			if (!(this.grid.table[i][j] instanceof Tuna) && !(this.grid.table[i][j] instanceof Shark)) {
				break;	
			}
		}
		var tuna = new Tuna(i, j);
		this.grid.table[i][j] = tuna;
		tunas--;
	}
	while (sharks > 0) {
		while (true) {
			i = Math.floor(Math.random() * width);
			j = Math.floor(Math.random() * height);
			if (!(this.grid.table[i][j] instanceof Tuna) && !(this.grid.table[i][j] instanceof Shark)) {
				break;	
			}
		}
		var shark = new Shark(i, j, 3);
		this.grid.table[i][j] = shark;
		sharks--;
	}
	this.grid.drawGrid();
}

Engine.prototype.run = function () {
	var agents = [];
	turns++;
	for (var i = 0; i < this.grid.table.length; i++) {
		for (var j = 0; j < this.grid.table[i].length; j++) {
			var agent = this.grid.table[i][j];
			if (agent instanceof Shark || agent instanceof Tuna) {
				agents.push({'x': i, 'y': j});
			}
		}
	}
	agents = shuffle(agents);
	var alreadyPlayed = [];
	this.age = {
	};
	for (var i = 0; i < agents.length; i++) {
		var coords = agents[i];
		var agent = this.grid.table[coords.x][coords.y];
		if (agent && alreadyPlayed.indexOf(agent) === -1) {
			var surroundings = getSurroundings(this.grid.table, coords.x, coords.y);
			agent.update(this.grid, surroundings);
			alreadyPlayed.push(agent);
		}
	}

	for (var i = 0; i < alreadyPlayed.length; i++) {
		var agent = alreadyPlayed[i];
		if (!agent) {
			continue;
		}
		var typeKey = null;
		if (agent instanceof Shark) {
			typeKey = 'shark';
		} else {
			typeKey = 'tuna';
		}
		var ageGroup = this.age[agent.age];
		if (!ageGroup) {
			ageGroup = {
				'shark': 0,
				'tuna': 0
			};
		}
		ageGroup[typeKey] = ageGroup[typeKey] + 1;
		this.age[agent.age] = ageGroup;
	}

	var textArea = document.getElementById('ageDump');
	var pyramid = '';
	var ages = Object.keys(this.age).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
	for (var i = 0; i < ages.length; i++) {
		var a = ages[i];
		pyramid += a + '\t' + this.age[a].shark + '\t' + this.age[a].tuna + '\n';
	}
	textArea.innerHTML = pyramid;
	this.population.push([turns, this.grid.sharks, this.grid.tunas]);
	this.ratio.push([this.grid.sharks, this.grid.tunas]);
	if (this.grid.sharks === 0 || this.grid.tunas === 0) {
		this.drawPopulation();
		this.drawRatio();
		try {
			this.drawAge();
		} catch (error) {
			console.trace(error);
		}
		var startButton = document.getElementById('startButton');
		startButton.onclick = startSimulation;
		startButton.innerHTML = 'Start';
		console.log('End of simulation after ' + turns + ' turns (sharks = ' + this.grid.sharks + ', tunas = ' + this.grid.tunas + ')');
		clearInterval(intervalId);
	}
	this.grid.drawGrid();
};

Engine.prototype.drawPopulation = function () {
	var data = this.population;
	var g = new Dygraph(document.getElementById('population'),
		data,
		{
			'title': 'Population de requins et de thons',
			'labels': ['turns', 'sharks', 'tunas']
		}
	);
	var dump = '';
	this.population.forEach(function (element){
		dump += element.join('\t') + '\n';
	});
	document.getElementById('populationDump').innerHTML = dump;
};

Engine.prototype.drawRatio = function () {
	var data = this.ratio;
	var g = new Dygraph (document.getElementById('ratio'),
		data,
		{
			'title': 'Ratio requins/thons',
			'drawPoints': true,
			'width': 1000
		}
	);
	var dump = '';
	this.ratio.forEach(function (element) {
		dump += element.join('\t') + '\n';
	});

	document.getElementById('ratioDump').innerHTML = dump;
};

Engine.prototype.drawAge = function () {
	var ageCategories = Object.keys(this.age).map(function (element) { return element + '';});
	var sharkAges = [];
	var tunaAges = [];
	var engineAge = this.age;
	var max = -1;
	ageCategories.forEach(function (age) {
		if (engineAge[age].shark > max) {
			max = engineAge[age].shark;
		}
		sharkAges.push(engineAge[age].shark);
		tunaAges.push(engineAge[age].tuna * -1);		
		if (engineAge[age].tuna > max) {
			max = engineAge[age].tuna;
		}
	});
    var categories = ageCategories;
    $('#pyramid').highcharts({
        chart: {
            type: 'bar'
        },
        title: {
            text: 'AgeGroups'
        },
        xAxis: [{
            categories: categories,
            reversed: false,
            labels: {
                step: 1
            }
        }, {
            opposite: true,
            reversed: false,
            categories: categories,
            linkedTo: 0,
            labels: {
                step: 1
            }
        }],
        yAxis: {
            title: {
                text: null
            },
            min: (max * - 1),
            max: max
        },

        plotOptions: {
            series: {
                stacking: 'normal'
            }
        },

        series: [{
            name: 'Shark',
            data: sharkAges
        }, {
            name: 'Tuna',
            data: tunaAges
        }]
    });
};

/**
 * List the cells surrounding cell (i, j) sorting them into 3 classes: free, tunas and sharks.
 * @parm {array[array]} grid - Grid
 * @param {Integer} i - First dimension coordinate
 * @param {Integer} j - Second dimension coordianate
 * @return {Object} - An object classifying the cells surrounding grid[i][j] in free, tunas and sharks.
 */
function getSurroundings(grid, i, j) {
	var surroundings = {
		'free': [],
		'tunas': [],
		'sharks': []
	};
	for (var k = i - 1; k <= i + 1; k++) {
		if (k < 0 || k >= grid.length) {
			continue;
		}
		for (var l = j - 1; l <= j + 1; l++) {
			if (l < 0 || l >= grid[i].length) {
				continue;
			}
			if (i === k && j === l) {
				continue;
			}
			var cell = {'x': k, 'y': l};
			if (grid[k][l] instanceof Shark) {
				surroundings.sharks.push(cell);
			} else if (grid[k][l] instanceof Tuna) {
				surroundings.tunas.push(cell);
			} else {
				surroundings.free.push(cell);						
			}
		}
	}
	return surroundings;
}


function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function startSimulation(event) {
	var divSimulation = document.getElementById('simulation');
	while (divSimulation.firstChild) {
		divSimulation.removeChild(divSimulation.firstChild);
	}
	var x = parseInt(document.getElementById('engine.x').value, 10);
	var y = parseInt(document.getElementById('engine.y').value, 10);
	var sharks = parseInt(document.getElementById('engine.sharks').value, 10)
	var tunas = parseInt(document.getElementById('engine.tunas').value, 10);
	var engine = new Engine(x, y, sharks, tunas);
	var startButton = document.getElementById('startButton');
	var pauseSimulation = function () {
		this.innerHTML = 'Resume';
		clearInterval(intervalId);
		this.onclick = resumeSimulation;
		engine.drawPopulation();
		engine.drawRatio();
		engine.drawAge();
		return false;
	};
	var resumeSimulation = function () {
		this.innerHTML = 'Pause';
		this.onclick = pauseSimulation;
		intervalId = setInterval(function () {
			engine.run();
		}, 10);
		return false;
	};
	startButton.onclick = resumeSimulation;
	startButton.onclick();
	return false;
}

window.onload = function () {
	document.getElementById('settings').onsubmit = startSimulation;
};
