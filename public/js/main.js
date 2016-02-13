var BOARD_SIZE = 1080;
var GRID_TILE_SIZE = 7;
var TILE_SIZE = 135;
var HALF_SIZE = TILE_SIZE / 2;

var tiles = {
	T: 'img/tiles/T.png',
	c: 'img/tiles/corner.png',
	s: 'img/tiles/straight.png'
};

var board;
var stage;
var queue;
var ctrl_piece;

// alias: c: corner, s: straight, T: T
var treasure_tiles = {
	bat:     {t:'T', x:26,  y:22,  s:0.62, r:0},
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

var grid7x7 = new Array(GRID_TILE_SIZE);
for (var idx=GRID_TILE_SIZE; idx--;) grid7x7[idx] = new Array(GRID_TILE_SIZE);

$(function(){
	queue = new createjs.LoadQueue(false);
	queue.on("complete", connectSocket, this);
	
	for (var key in tiles) {
		queue.loadFile({id: key, src: tiles[key]});
	}
	
	for (var key in treasure_tiles) {
		queue.loadFile({id: key, src: 'img/treasures/' + key + '.png'});
	}


	$('#start').click(function() {
		socket.emit('start');
	});

	$('#move').click(function() {
		socket.emit('move');
	});
});

function setupBoard(board_setup) {
	stage = new createjs.Stage("board");
	stage.enableMouseOver(20); 
	
	board = new createjs.Container();
	
	board.x = board.y = board.regX = board.regY = BOARD_SIZE / 2;
	board.rotation = me.rotation;
	
	stage.addChild(board);
	
	ctrl_stage = new createjs.Stage("ctrl");
	createjs.Ticker.addEventListener("tick", tick);
	
	addTriangleControls();

	ctrl_piece = getPiece( board_setup.ctrl );
	
	ctrl_piece.y = ctrl_piece.x = (191 - 135) / 2;
	ctrl_stage.addChild(ctrl_piece);
	
	ctrl_piece.addEventListener('click', rotateControl);

	for (var row_idx=0; row_idx<GRID_TILE_SIZE; row_idx++) {
		for (var col_idx=0; col_idx<GRID_TILE_SIZE; col_idx++) {
			var mc;
			
			if (board_setup.board[row_idx][col_idx]) {
				mc = getPiece(board_setup.board[row_idx][col_idx][0], board_setup.board[row_idx][col_idx][1]);
			}
			else {
				mc = getPiece();
			}

			mc.x = HALF_SIZE + col_idx * TILE_SIZE;
			mc.y = HALF_SIZE + row_idx * TILE_SIZE;
			mc.lab_meta.row_idx = row_idx;
			mc.lab_meta.col_idx = col_idx;
			
			grid7x7[row_idx][col_idx] = mc;
			
			board.addChild(mc);
		}
	}
	
	tick();
}

function tick() {
	stage.update();
	ctrl_stage.update();
}

function shiftTiles(data) {
	var piece = ctrl_piece;
	
	piece.lab_meta.mc.rotation = data.ctrl_rotation;
	
	board.addChild(piece);
	
	if (data.row_idx) {
		piece.y = HALF_SIZE + data.row_idx * TILE_SIZE;
		piece.lab_meta.row_idx = data.row_idx;
		
		if (data.direction > 0) {
			piece.x = -TILE_SIZE;
			piece.lab_meta.col_idx = 0;

			createjs.Tween.get(piece)
				.to({x: piece.x + HALF_SIZE}, 250)
				.to({x: piece.x + HALF_SIZE + TILE_SIZE}, 500);
			
			// we need to animate all pieces
			for (var col_idx=0; col_idx<GRID_TILE_SIZE-1; col_idx++) {
				var mc = grid7x7[data.row_idx][col_idx];
				createjs.Tween.get(mc).wait(250).to({x: mc.x + TILE_SIZE}, 500);
			}
			
			// last piece must slide out of canvas
			var mc = grid7x7[data.row_idx][GRID_TILE_SIZE-1];
			createjs.Tween.get(mc)
				.wait(250)
				.to({x: mc.x + TILE_SIZE}, 500)
				.to({x: mc.x + TILE_SIZE + HALF_SIZE}, 250)
				.call(shiftComplete, [data, piece, mc]);
		}
		else {
			piece.x = (GRID_TILE_SIZE+1) * TILE_SIZE;
			piece.lab_meta.col_idx = GRID_TILE_SIZE-1;

			createjs.Tween.get(piece)
				.to({x: piece.x - HALF_SIZE}, 250)
				.to({x: piece.x - HALF_SIZE - TILE_SIZE}, 500);
			
			// we need to animate all pieces
			for (var col_idx=GRID_TILE_SIZE; col_idx-->1; ) {
				var mc = grid7x7[data.row_idx][col_idx];
				createjs.Tween.get(mc).wait(250).to({x: mc.x - TILE_SIZE}, 500);
			}
			
			// last piece must slide out of canvas
			var mc = grid7x7[data.row_idx][0];
			createjs.Tween.get(mc)
				.wait(250)
				.to({x: mc.x - TILE_SIZE}, 500)
				.to({x: mc.x - TILE_SIZE - HALF_SIZE}, 250)
				.call(shiftComplete, [data, piece, mc]);
		}
	}
	else {
		piece.x = HALF_SIZE + data.col_idx * TILE_SIZE;
		piece.lab_meta.col_idx = data.col_idx;
		
		if (data.direction > 0) {
			piece.y = -TILE_SIZE;
			piece.lab_meta.row_idx = 0;

			createjs.Tween.get(piece)
				.to({y: piece.y + HALF_SIZE}, 250)
				.to({y: piece.y + HALF_SIZE + TILE_SIZE}, 500);
			
			// we need to animate all pieces
			for (var row_idx=0; row_idx<GRID_TILE_SIZE-1; row_idx++) {
				var mc = grid7x7[row_idx][data.col_idx];
				createjs.Tween.get(mc).wait(250).to({y: mc.y + TILE_SIZE}, 500);
			}
			
			// last piece must slide out of canvas
			var mc = grid7x7[GRID_TILE_SIZE-1][data.col_idx];
			createjs.Tween.get(mc)
				.wait(250)
				.to({y: mc.y + TILE_SIZE}, 500)
				.to({y: mc.y + TILE_SIZE + HALF_SIZE}, 250)
				.call(shiftComplete, [data, piece, mc]);
		}
		else {
			piece.y = (GRID_TILE_SIZE+1) * TILE_SIZE;
			piece.lab_meta.row_idx = GRID_TILE_SIZE-1;

			createjs.Tween.get(piece)
				.to({y: piece.y - HALF_SIZE}, 250)
				.to({y: piece.y - HALF_SIZE - TILE_SIZE}, 500);
			
			// we need to animate all pieces
			for (var row_idx=GRID_TILE_SIZE; row_idx-->1; ) {
				var mc = grid7x7[row_idx][data.col_idx];
				createjs.Tween.get(mc).wait(250).to({y: mc.y - TILE_SIZE}, 500);
			}
			
			// last piece must slide out of canvas
			var mc = grid7x7[0][data.col_idx];
			createjs.Tween.get(mc)
				.wait(250)
				.to({y: mc.y - TILE_SIZE}, 500)
				.to({y: mc.y - TILE_SIZE - HALF_SIZE}, 250)
				.call(shiftComplete, [data, piece, mc]);
		}
	}
} 

function shiftComplete(data, added_piece, ejected_piece) {
	// animation is complete, now, we update the grid
	// piece that was pushed becomes new control piece
	
	ctrl_piece.removeEventListener('click', rotateControl);
	stage.removeChild(ejected_piece);
	ctrl_stage.removeChild(ctrl_piece);

	ctrl_piece = ejected_piece;
	ctrl_piece.y = ctrl_piece.x = (191 - 135) / 2;
	ctrl_piece.addEventListener('click', rotateControl);
	ctrl_stage.addChild(ctrl_piece);

	if (data.row_idx) {
		if (data.direction >= 1) {
			for (var col_idx=GRID_TILE_SIZE; col_idx-->1; ) {
				grid7x7[data.row_idx][col_idx] = grid7x7[data.row_idx][col_idx - 1];
			}
			grid7x7[data.row_idx][0] = added_piece;
		}
		else {
			for (var col_idx=0; col_idx<GRID_TILE_SIZE-1; col_idx++) {
				grid7x7[data.row_idx][col_idx] = grid7x7[data.row_idx][col_idx + 1];
			}
			grid7x7[data.row_idx][GRID_TILE_SIZE-1] = added_piece;
		}
	}
	else {
		if (data.direction >= 1) {
			for (var row_idx=GRID_TILE_SIZE; row_idx-->1; ) {
				grid7x7[row_idx][data.col_idx] = grid7x7[row_idx - 1][data.col_idx];
			}
			grid7x7[0][data.col_idx] = added_piece;
		}
		else {
			for (var row_idx=0; row_idx<GRID_TILE_SIZE-1; row_idx++) {
				grid7x7[row_idx][data.col_idx] = grid7x7[row_idx + 1][data.col_idx];
			}
			grid7x7[GRID_TILE_SIZE-1][data.col_idx] = added_piece;
		}
	}

	animation_done();
}

function rotateControl(evt) {
	if (rotateControl.rotating) return;
	rotateControl.rotating = true;

	var mc = evt.currentTarget.lab_meta.mc;
	createjs.Tween.get(mc).to({rotation: mc.rotation + 90}, 200).call(function() {
		mc.rotation %= 360;
		delete rotateControl.rotating;
	});
}

function getPiece(name, rotation) {
	if (rotation === undefined || rotation === -1) rotation = Math.floor(Math.random() * 4) * 90;

	var tile, treasure, bg, player_marker;
	
	if (treasure_tiles[name]) {
		tile = treasure_tiles[name];
		bg = new createjs.Bitmap(queue.getResult(tile.t));
		treasure = new createjs.Bitmap(queue.getResult(name));
	}
	else if (player_tiles[name]) {
		var player_marker = new createjs.Shape();
		player_marker.graphics
			.setStrokeStyle(1)
			.beginStroke('#000000')
			.beginFill(player_tiles[name])
			.drawCircle(HALF_SIZE+2, HALF_SIZE-2, 21);

		bg = new createjs.Bitmap(queue.getResult('c'));
	}
	else {
		bg = new createjs.Bitmap(queue.getResult(name));
	}

	var piece = new createjs.Container();
	piece.snapToPixel = true;

	var mc = new createjs.Container();
	bg.snapToPixel = true;
	mc.snapToPixel = true;
	mc.regX = mc.regY = HALF_SIZE;
	mc.x = mc.y = HALF_SIZE;
	mc.rotation = rotation;
	mc.addChild(bg);
	
	if (treasure) {
		treasure.x = tile.x;
		treasure.y = tile.y;
		treasure.scaleX = treasure.scaleY = tile.s;
		treasure.rotation = tile.r;
		mc.addChild(treasure);
	}
	
	if (player_marker) {
		mc.addChild(player_marker);
	}
	
	piece.addChild(mc);
	
	piece.lab_meta = {
		mc: mc,
		treasure: treasure
	};
	
	return piece;
}

function requestShift(evt) {
	if (current_player_index !== me.index) {
		// TODO: visual feedback to show nothing will move
		return;
	}

	socket.emit('shift', $.extend(
		{
			ctrl_rotation: (ctrl_piece.lab_meta.mc.rotation - me.rotation + 360) % 360
		},
		evt.currentTarget.action_data
	));
}

function movePlayer() {
	// TODO: move player on board
	animation_done();
}

function addTriangleControls() {
	// get and position triangles
	var button = new createjs.Container();
	var mc = getTriangleGraphic();
	mc.x = HALF_SIZE / 2;
	mc.y = TILE_SIZE / 2;
	button.addChild(mc);
	button.x = 0;
	button.y = HALF_SIZE + TILE_SIZE;
	button.action_data = {row_idx: 1, direction: 1};
	button.addEventListener('click', requestShift);
	button.cursor = 'pointer';
	board.addChild(button);
	
	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {row_idx: 3, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {row_idx: 5, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.children[0].rotation = 180;
	button.x = HALF_SIZE + GRID_TILE_SIZE * TILE_SIZE;
	button.y = HALF_SIZE + TILE_SIZE;
	button.action_data = {row_idx: 1, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {row_idx: 3, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {row_idx: 5, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.children[0].rotation = 90;
	button.children[0].x = TILE_SIZE / 2;
	button.children[0].y = HALF_SIZE / 2;
	button.x = HALF_SIZE + TILE_SIZE;
	button.y = 0;
	button.action_data = {col_idx: 1, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {col_idx: 3, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {col_idx: 5, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.children[0].rotation = -90;
	button.x = HALF_SIZE + TILE_SIZE;
	button.y = HALF_SIZE + GRID_TILE_SIZE * TILE_SIZE;
	button.action_data = {col_idx: 1, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {col_idx: 3, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {col_idx: 5, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
}

function getTriangleGraphic() {
	// create one triangle pointing right
	var g = new createjs.Graphics();
	g.beginFill("orange");
	g.moveTo(0,0);
	g.lineTo(38, 28);
	g.lineTo(0, 56);
	g.endFill();
	
	var shape = new createjs.Shape(g);
	
	shape.regX = 19;
	shape.regY = 28;

	return shape;
}
