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
	],
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

shuffle(default_rvbr_tiles);

// populate board
for (var idx=default_rvbr_board.length; idx--; ) {
	for (var jdx=default_rvbr_board.length; jdx--; ) {
		if (!default_rvbr_board[idx][jdx]) {
			default_rvbr_board[idx][jdx] = [default_rvbr_tiles.pop(), -1];
		}
	}
}

var board_setup = JSON.stringify({
	board: default_rvbr_board,
	ctrl: default_rvbr_tiles[0]
});

// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o) {
	for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
}



