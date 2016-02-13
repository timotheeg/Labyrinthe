var utils = require('./utils');

module.exports = Board;

function Board() {
	// make a deep clone of the board and position moveable tiles
	var tiles = utils.shuffle(default_rvbr_tiles.concat());
	var board = default_rvbr_board.concat();

	board.map(function(cell) {
		return cell
			? cell.concat()
			: [tiles.pop(), -1]
		;
	});

	this.board = board;
	this.ctrl = tiles[0];
}

Board.prototype.toJSON = function() {
	return {
		board: this.board,
		ctrl:  this.ctrl
	};
};

Board.prototype.canMove = function(srcPos, targetPos) {
	// TODO
};

var path_matrixes = {
	corner: [
		[0, 1, 0],
		[0, 1, 1],
		[0, 0, 0]
	],
	straight: [
		[0, 1, 0],
		[0, 1, 0],
		[0, 1, 0]
	],
	T: [
		[0, 1, 0],
		[1, 1, 1],
		[0, 0, 0]
	]
};

var default_rvbr_board = [
	[['yellow',  90], null, ['book',  180], null, ['coins', 180], null, ['red',   180]],
	[null,            null, null,           null, null,           null, null          ],
	[['map',     90], null, ['crown',  90], null, ['keys',  180], null, ['skull', 270]],
	[null,            null, null,           null, null,           null, null          ],
	[['ring',    90], null, ['chest',   0], null, ['ruby',  270], null, ['sword', 270]],
	[null,            null, null,           null, null,           null, null          ],
	[['green',    0], null, ['candles', 0], null, ['helmet',  0], null, ['blue' , 270]]
];

var default_rvbr_tiles = ['mouse', 'moth', 'beetle', 'spider', 'troll', 'genie', 'ghost', 'bat', 'fairy', 'dragon', 'newt', 'owl']
	.concat('ccccccccccssssssssssss'.split(''));
