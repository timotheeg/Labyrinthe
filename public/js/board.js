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
var treasure_tiles = {
	bat:     {t:'T', x:26,  y:22,  s:0.62,  r:0},
	beetle:  {t:'c', x:72,  y:10,  s:0.54, r:45},
	book:    {t:'T', x:26,  y:14,  s:0.6,  r:0},
	candles: {t:'T', x:28,  y:16,  s:0.6,  r:0},
	chest:   {t:'T', x:28,  y:23,  s:0.6,  r:0},
	coins:   {t:'T', x:26,  y:22,  s:0.6,  r:0},
	crown:   {t:'T', x:29,  y:23,  s:0.59, r:0},
	dragon:  {t:'T', x:29,  y:20,  s:0.58, r:0},
	fairy:   {t:'T', x:31,  y:16,  s:0.55, r:0},
	genie:   {t:'T', x:27,  y:13,  s:0.58, r:0},
	ghost:   {t:'T', x:32,  y:14,  s:0.65, r:0},
	helmet:  {t:'T', x:26,  y:11,  s:0.6,  r:0},
	keys:    {t:'T', x:28,  y:19,  s:0.6,  r:0},
	map:     {t:'T', x:22,  y:34,  s:0.55, r:-15},
	moth:    {t:'c', x:73,  y:3,   s:0.61, r:45},
	mouse:   {t:'c', x:115, y:103, s:0.55, r:180},
	owl:     {t:'c', x:41,  y:108, s:0.56, r:-90},
	ring:    {t:'T', x:14,  y:47,  s:0.58, r:-30},
	ruby:    {t:'T', x:31,  y:21,  s:0.55, r:0},
	newt:    {t:'c', x:34,  y:100, s:0.58, r:-90},
	skull:   {t:'T', x:27,  y:23,  s:0.62, r:0},
	spider:  {t:'c', x:37,  y:100, s:0.58, r:-90},
	sword:   {t:'T', x:27,  y:7,   s:0.60, r:0},
	troll:   {t:'T', x:29,  y:17,  s:0.58, r:0}
};

var player_tiles = {
	yellow: '#ffff00',
	red:    '#ff0000',
	blue:   '#330066',
	green:  '#009933'
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



