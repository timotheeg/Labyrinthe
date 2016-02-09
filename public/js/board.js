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

// alias: c: corner, s: straight, T: T
var default_rvbr_board = [
	[['c',  90, null], null, ['T', 180, null], null, ['T', 180, null], null, ['c', 180, null]],
	[null,             null, null,             null, null,             null, null            ],
	[['T',  90, null], null, ['T',  90, null], null, ['T', 180, null], null, ['T', 270, null]],
	[null,             null, null,             null, null,             null, null            ],
	[['T',  90, null], null, ['T',   0, null], null, ['T', 270, null], null, ['T', 270, null]],
	[null,             null, null,             null, null,             null, null            ],
	[['c',   0, null], null, ['T',   0, null], null, ['T',   0, null], null, ['c', 270, null]]
];

var default_rvbr_tiles = 'ccccccccccccccccssssssssssssTTTTTT'.split(''); // TODO: need to specify where the treasures are

shuffle(default_rvbr_tiles);

// populate board
for (var idx=default_rvbr_board.length; idx--; ) {
	for (var jdx=default_rvbr_board.length; jdx--; ) {
		if (!default_rvbr_board[idx][jdx]) {
			default_rvbr_board[idx][jdx] = [default_rvbr_tiles.pop(), -1, null];
		}
	}
}

console.log(default_rvbr_board);

var board_setup = JSON.stringify({
	board: default_rvbr_board,
	ctrl: default_rvbr_tiles[0]
});

// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}



