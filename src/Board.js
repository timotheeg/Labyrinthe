var utils = require('./utils');
var pathfinding = require("node-pathfinding");

module.exports = Board;

var
	GRID_SIZE = 7,
	LAST_IDX = 6;

function Board() {
	// make a deep clone of the board and add-in the moveable tiles randomly
	var tiles = utils.shuffle(default_rvbr_tiles.concat());
	var board = default_rvbr_board.map(function(row) {
		return row.map(function(cell) {
			return cell
				? cell.concat()
				: [tiles.pop(), getRandomAngle()]
			;
		});
	});

	this.board = board;
	this.ctrl = tiles[0];

	// Question: should we generate the path matrix now too?
}

Board.prototype.shift = function(data) {
	var injected = [this.ctrl, data.ctrl_rotation];

	if ('row_idx' in data) {
		// row shifting, easy
		if (data.direction == 1) {
			this.ctrl = this.board[data.row_idx].pop()[0];
			this.board[data.row_idx].unshift(injected);
		}
		else {
			this.ctrl = this.board[data.row_idx].shift()[0];
			this.board[data.row_idx].push(injected);
		}
	}
	else {
		// column shifting, must do by hand :/
		if (data.direction == 1) {
			this.ctrl = this.board[LAST_IDX][data.col_idx][0];
			for (var row_idx=this.board.length; row_idx-->1; ) {
				this.board[row_idx][data.col_idx] = this.board[row_idx-1][data.col_idx];
			}
			this.board[0][data.col_idx] = injected;
		}
		else {
			this.ctrl = this.board[0][data.col_idx][0];
			for (var row_idx=0; row_idx<LAST_IDX; row_idx++) {
				this.board[row_idx][data.col_idx] = this.board[row_idx+1][data.col_idx];
			}
			this.board[LAST_IDX][data.col_idx] = injected;
		}
	}
};

Board.prototype.toJSON = function() {
	return {
		board: this.board,
		ctrl:  this.ctrl
	};
};

Board.prototype.getTile = function(x, y) {
	return this.board[y][x];
};

Board.prototype.getPath = function(srcX, srcY, tgtX, tgtY) {
	// TODO: maintain the path matrix state and change it on shift
	var matrix = getPathMatrix(this.board);

	console.log(matrix);

	// Convert the grid coordinate into path coordinates
	srcX = srcX * 3 + 1;
	srcY = srcY * 3 + 1;
	tgtX = tgtX * 3 + 1;
	tgtY = tgtY * 3 + 1;

	console.log(srcX, srcY, tgtX, tgtY);

	var dimension = GRID_SIZE * 3;

	// Check if there is a path from source to target
	var buf  = pathfinding.bytesFrom2DArray(dimension, dimension, matrix);
	var grid = pathfinding.buildGrid(dimension, dimension, buf);
	var path = pathfinding.findPath(srcX, srcY, tgtX, tgtY, grid);

	console.log(path);

	if (!path || !path.length) return null;

	// Transform the path from submatrixes to tiles positions
	var res = [];
	for (var idx=0; idx<path.length; idx+=3) {
		var cell = path[idx];
		res.push({
			x: Math.floor(((cell >>> 16) - 1) / 3),
			y:  Math.floor(((cell & 0xFFFF) - 1) / 3)
		});
	}

	console.log(res);

	return res;
};

// path matrixes used to do path finding later
var path_matrixes = {
	c: [
		[1, 0, 1],
		[1, 0, 0],
		[1, 1, 1]
	],
	s: [
		[1, 0, 1],
		[1, 0, 1],
		[1, 0, 1]
	],
	T: [
		[1, 0, 1],
		[0, 0, 0],
		[1, 1, 1]
	]
};

var default_rvbr_board = [
	[['yellow',  90], null, ['book',  180], null, ['coins', 180], null, ['red',   180]],
	[null,            null, null,           null, null,           null, null          ],
	[['map',     90], null, ['crown',  90], null, ['keys',  180], null, ['skull', 270]],
	[null,            null, null,           null, null,           null, null          ],
	[['ring',    90], null, ['chest',   0], null, ['ruby',  270], null, ['sword', 270]],
	[null,            null, null,           null, null,           null, null          ],
	[['green',    0], null, ['candles', 0], null, ['helmet',  0], null, ['blue',  270]]
];

var default_rvbr_tiles = ['mouse', 'moth', 'beetle', 'spider', 'troll', 'genie', 'ghost', 'bat', 'fairy', 'dragon', 'newt', 'owl']
	.concat('ccccccccccssssssssssss'.split(''));

var named_tiles = {
	bat:     'T',
	beetle:  'c',
	book:    'T',
	candles: 'T',
	chest:   'T',
	coins:   'T',
	crown:   'T',
	dragon:  'T',
	fairy:   'T',
	genie:   'T',
	ghost:   'T',
	helmet:  'T',
	keys:    'T',
	map:     'T',
	moth:    'c',
	mouse:   'c',
	owl:     'c',
	ring:    'T',
	ruby:    'T',
	newt:    'c',
	skull:   'T',
	spider:  'c',
	sword:   'T',
	troll:   'T',

	yellow:  'c',
	red:     'c',
	blue:    'c',
	green:   'c'
};

function getRandomAngle()
{
	return Math.floor(Math.random() * 4) * 90;
}

function getPathMatrix(board)
{
	var idx, jdx, m = new Array(GRID_SIZE*3);

	for (idx=GRID_SIZE*3; idx--; )
	{
		m[idx] = new Array(GRID_SIZE*3);
	}

	for (idx=GRID_SIZE; idx--; )
	{
		for (jdx=GRID_SIZE; jdx--; )
		{
			var
				piece     = board[idx][jdx],
				name      = piece[0],
				tile_type = (name in named_tiles ? named_tiles[name] : name),
				angle     = piece[1],
				sub       = path_matrixes[tile_type];

			// console.log(idx, jdx, piece, tile_type);

			sub = rotate[angle](sub);

			inject(m, sub, idx*3, jdx*3);
		}
	}

	return m;
}

// rotate the path matrixes
var rotate = {
	0: function(m)
	{
		return [
			[m[0][0], m[0][1], m[0][2]],
			[m[1][0], m[1][1], m[1][2]],
			[m[2][0], m[2][1], m[2][2]]
		];
	},
	90: function(m)
	{
		return [
			[m[2][0], m[1][0], m[0][0]],
			[m[2][1], m[1][1], m[0][1]],
			[m[2][2], m[1][2], m[0][2]]
		];
	},
	180: function(m)
	{
		return [
			[m[2][2], m[2][1], m[2][0]],
			[m[1][2], m[1][1], m[1][0]],
			[m[0][2], m[0][1], m[0][0]]
		];
	},
	270: function(m)
	{
		return [
			[m[0][2], m[1][2], m[2][2]],
			[m[0][1], m[1][1], m[2][1]],
			[m[0][0], m[1][0], m[2][0]]
		];
	}
};

function inject(grid, sub, x, y)
{
	for (var idx=3; idx--; )
	{
		for (var jdx=3; jdx--; )
		{
			grid[x+idx][y+jdx] = sub[idx][jdx];
		}
	}
}
