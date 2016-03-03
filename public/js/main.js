var BOARD_SIZE = 1080;
var GRID_SIZE = 7;
var TILE_SIZE = 135;
var HALF_SIZE = TILE_SIZE / 2;
var CARD_WIDTH = 179;
var CARD_HEIGHT = 280;

var tiles = {
	T: 'img/tiles/T.png',
	c: 'img/tiles/corner.png',
	s: 'img/tiles/straight.png'
};

var stage;

var main_container;
var board_container;
var players_container;
var controls_container;

var board;
var players = {};
var buttons = {};
var current_player_index = -1;
var last_shift = null;
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

var grid7x7 = new Array(GRID_SIZE);
for (var idx=GRID_SIZE; idx--;) grid7x7[idx] = new Array(GRID_SIZE);

$(function(){
	if (false && screenfull.enabled) {
		function getStarted(evt) {
			document.removeEventListener(screenfull.raw.fullscreenchange, getStarted);
			document.removeEventListener(screenfull.raw.fullscreenerror,  getStarted);

			setTimeout(init, 500);
		}

		document.addEventListener(screenfull.raw.fullscreenchange, getStarted);
		document.addEventListener(screenfull.raw.fullscreenerror,  getStarted);

		$('#fs')
			.click(function(evt) {
				evt.preventDefault();
				$(this).hide();
				screenfull.request();
			});
	}
	else {
		$('#fs').hide();
		init();
	}
});

function init() {
	setupStage();

	// preload assets
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
};

function resize() {
	// Resize canvas area based on BOARD_SIZE
	// TODO: use a dynamic approach

	var
		width, height,
		screen_ratio = window.innerWidth / window.innerHeight,
		is_landscape = screen_ratio > 1;

	if (is_landscape) {
		// landscape
		// board will fit height, need to determine width
		width = Math.round(BOARD_SIZE * screen_ratio);
		height = BOARD_SIZE;
	}
	else {
		// portait
		// board will fit width, need to determine height
		width = BOARD_SIZE;
		height = Math.round(BOARD_SIZE / screen_ratio);
	}

	// canvas rendering takes all available space
	$('#stage')
		.attr({width: width, height: height})
		.css({width: window.innerWidth, height: window.innerHeight});

	stage.canvas.width  = width;
	stage.canvas.height = height;

	// adjust visual element in canvas
	// TODO: animate
	board_container.x = 0;
	board_container.y = 0;

	if (is_landscape) {
		controls_container.x = BOARD_SIZE;
		controls_container.y = 0;
		controls_container.setSize(width - BOARD_SIZE, BOARD_SIZE / 2);

		players_container.x = BOARD_SIZE;
		players_container.y = BOARD_SIZE / 2;
		players_container.setSize(width - BOARD_SIZE, BOARD_SIZE / 2);
	}
	else {
		controls_container.y = BOARD_SIZE;
		controls_container.x = 0;
		controls_container.setSize(BOARD_SIZE / 2, height - BOARD_SIZE);

		players_container.y = BOARD_SIZE;
		players_container.x = BOARD_SIZE / 2;
		players_container.setSize(BOARD_SIZE / 2, height - BOARD_SIZE);
	}
}

function setupStage() {
	stage = new createjs.Stage("stage");
	stage.enableMouseOver(20);

	main_container = new createjs.Container();
	stage.addChild(main_container);

	board_container = new createjs.Container();
	main_container.addChild(board_container);

	players_container = new createjs.Container();
	main_container.addChild(players_container);
	players_container.setSize = setPlayersSize;
	players_container.player1 = new createjs.Container();
	players_container.addChild(players_container.player1);
	players_container.player2 = new createjs.Container();
	players_container.addChild(players_container.player2);
	players_container.player3 = new createjs.Container();
	players_container.addChild(players_container.player3);
	players_container.player4 = new createjs.Container();
	players_container.addChild(players_container.player4);

	controls_container = new createjs.Container();
	main_container.addChild(controls_container);
	controls_container.setSize = setControlsSize;
	controls_container.card    = new createjs.Container();
	controls_container.addChild(controls_container.card);
	controls_container.control = new createjs.Container();
	controls_container.addChild(controls_container.control);

	board = new createjs.Container();
	board.x = board.y = board.regX = board.regY = BOARD_SIZE / 2;
	board_container.addChild(board);

	createjs.Ticker.addEventListener('tick', tick);

	window.addEventListener('resize', resize, false);
	resize();
}

function setupBoard(board_setup) {
	console.log('setupBoard');
	// prepare the board for dpi management

	board.rotation = me.rotation;
	
	addTriangleControls();

	ctrl_piece = getPiece( board_setup.ctrl );
	ctrl_piece.addEventListener('click', rotateControl);

	controls_container.control.addChild(ctrl_piece);

	for (var row_idx=0; row_idx<GRID_SIZE; row_idx++) {
		for (var col_idx=0; col_idx<GRID_SIZE; col_idx++) {
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
			mc.addEventListener('click', requestMove);
			
			grid7x7[row_idx][col_idx] = mc;
			
			board.addChild(mc);
		}
	}
	
	tick();
}

function setPlayersSize() {
	// TODO
}

function setControlsSize(width, height) {
	var
		min_space   = 10,
		ctrl_size   = TILE_SIZE; // 135

	// find smallest scale ratio to apply to both card and control
	var scale, scaleH=1, scaleW=1;

	if (CARD_HEIGHT + min_space * 2 > height) {
		scaleH = (height - min_space * 2) / CARD_HEIGHT;
	}

	if (CARD_WIDTH + ctrl_size + min_space * 3 > width) {
		scaleW = (width - min_space * 3) / (CARD_WIDTH + ctrl_size);
	}

	scale = Math.min(scaleH, scaleW);

	this.card.scaleX
		= this.card.scaleY
		= this.control.scaleX
		= this.control.scaleY
		= scale;

	// now that sizes are fixed, do actual placement
	var
		space_v = Math.floor((height - CARD_HEIGHT * scale) / 2),
		space_h = Math.floor((width - CARD_WIDTH * scale - ctrl_size * scale) / 3);

	this.card.x = space_h;
	this.card.y = space_v;

	this.control.x = space_h * 2 + Math.round(CARD_WIDTH * scale);
	this.control.y = Math.floor((height - ctrl_size * scale) / 2);
}

function setupPlayer(player) {
	if (players[player.color]) {
		$.extend(players[player.color], player);
	}
	else {
		players[player.color] = player;
	}

	// create player marker and place it on the board
	player.marker = getPlayerMarker(player.color);

	grid7x7[player.y][player.x].addChild(player.marker);
}

function tick() {
	stage.update();
}

function start() {
	// game is starting, there will be no more player
	// anything to do?
}

function setCurrentPlayer(index) {
	current_player_index = index;

	var player;

	for (var color in players) {
		player = players[color];
		if (player.index === index) break;
	}

	if (player.color === me.color) {
		animatePlayerMarker(player);
	}

	animation_done();
}

function animatePlayerMarker(player) {
	createjs.Tween.get(player.marker.circle, {loop:true, override:true})
		.to({scaleX: 2, scaleY: 2, alpha: 1  }, 250)
		.to({scaleX: 1, scaleY: 1, alpha: 0.4}, 250);
}

function shiftTiles(data) {
	var piece = ctrl_piece;

	// indicates which button is no longer available
	for (var key in buttons) {
		buttons[key].visible = true;
	}

	var token = ('row_idx' in data ? ['y', data.row_idx] : ['x', data.col_idx]).concat([data.direction * -1]).join('.');
	buttons[token].visible = false;

	piece.removeEventListener('click', rotateControl);
	piece.addEventListener('click', requestMove);
	
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
			for (var col_idx=0; col_idx<GRID_SIZE-1; col_idx++) {
				var mc = grid7x7[data.row_idx][col_idx];
				createjs.Tween.get(mc).wait(250).to({x: mc.x + TILE_SIZE}, 500);
			}
			
			// last piece must slide out of canvas
			var mc = grid7x7[data.row_idx][GRID_SIZE-1];
			createjs.Tween.get(mc)
				.wait(250)
				.to({x: mc.x + TILE_SIZE}, 500)
				.to({x: mc.x + TILE_SIZE + HALF_SIZE}, 250)
				.call(shiftComplete, [data, piece, mc]);
		}
		else {
			piece.x = (GRID_SIZE+1) * TILE_SIZE;
			piece.lab_meta.col_idx = GRID_SIZE-1;

			createjs.Tween.get(piece)
				.to({x: piece.x - HALF_SIZE}, 250)
				.to({x: piece.x - HALF_SIZE - TILE_SIZE}, 500);
			
			// we need to animate all pieces
			for (var col_idx=GRID_SIZE; col_idx-->1; ) {
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
			for (var row_idx=0; row_idx<GRID_SIZE-1; row_idx++) {
				var mc = grid7x7[row_idx][data.col_idx];
				createjs.Tween.get(mc).wait(250).to({y: mc.y + TILE_SIZE}, 500);
			}
			
			// last piece must slide out of canvas
			var mc = grid7x7[GRID_SIZE-1][data.col_idx];
			createjs.Tween.get(mc)
				.wait(250)
				.to({y: mc.y + TILE_SIZE}, 500)
				.to({y: mc.y + TILE_SIZE + HALF_SIZE}, 250)
				.call(shiftComplete, [data, piece, mc]);
		}
		else {
			piece.y = (GRID_SIZE+1) * TILE_SIZE;
			piece.lab_meta.row_idx = GRID_SIZE-1;

			createjs.Tween.get(piece)
				.to({y: piece.y - HALF_SIZE}, 250)
				.to({y: piece.y - HALF_SIZE - TILE_SIZE}, 500);
			
			// we need to animate all pieces
			for (var row_idx=GRID_SIZE; row_idx-->1; ) {
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
	ctrl_piece = ejected_piece;
	ctrl_piece.removeEventListener('click', requestMove);
	ctrl_piece.addEventListener('click', rotateControl);
	ctrl_piece.x = ctrl_piece.y = 0;
	controls_container.control.addChild(ctrl_piece);

	if ('row_idx' in data) {
		if (data.direction >= 1) {
			for (var col_idx=GRID_SIZE; col_idx-->1; ) {
				grid7x7[data.row_idx][col_idx] = grid7x7[data.row_idx][col_idx - 1];
				grid7x7[data.row_idx][col_idx].lab_meta.col_idx = col_idx;
			}
			grid7x7[data.row_idx][0] = added_piece;
		}
		else {
			for (var col_idx=0; col_idx<GRID_SIZE-1; col_idx++) {
				grid7x7[data.row_idx][col_idx] = grid7x7[data.row_idx][col_idx + 1];
				grid7x7[data.row_idx][col_idx].lab_meta.col_idx = col_idx;
			}
			grid7x7[data.row_idx][GRID_SIZE-1] = added_piece;
		}
	}
	else {
		if (data.direction >= 1) {
			for (var row_idx=GRID_SIZE; row_idx-->1; ) {
				grid7x7[row_idx][data.col_idx] = grid7x7[row_idx - 1][data.col_idx];
				grid7x7[row_idx][data.col_idx].lab_meta.row_idx = row_idx;
			}
			grid7x7[0][data.col_idx] = added_piece;
		}
		else {
			for (var row_idx=0; row_idx<GRID_SIZE-1; row_idx++) {
				grid7x7[row_idx][data.col_idx] = grid7x7[row_idx + 1][data.col_idx];
				grid7x7[row_idx][data.col_idx].lab_meta.row_idx = row_idx;
			}
			grid7x7[GRID_SIZE-1][data.col_idx] = added_piece;
		}
	}

	// update players position if they were ejected
	for (var color in players) {
		var player = players[color];
		if ('row_idx' in data) {
			if (player.y == data.row_idx) {
				player.x += data.direction;
				if (player.x < 0 || player.x >= GRID_SIZE) {
					player.x = (player.x + GRID_SIZE) % GRID_SIZE;
					grid7x7[player.y][player.x].addChild(player.marker);
				}
			}
		}
		else {
			if (player.x == data.col_idx) {
				player.y += data.direction;
				if (player.y < 0 || player.y >= GRID_SIZE) {
					player.y = (player.y + GRID_SIZE) % GRID_SIZE;
					grid7x7[player.y][player.x].addChild(player.marker);
				}
			}
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

function requestMove(evt) {
	if (animating) return;

	var target = evt.currentTarget.lab_meta;

	socket.emit('move', {
		x: target.col_idx,
		y: target.row_idx
	});
}

function getCard(treasure_name) {
	var mc = new createjs.Container();

	// card background
	mc.addChild(
		new createjs.Bitmap("/img/cards/front.png")
	);

	var treasure = new createjs.Bitmap(queue.getResult(treasure_name));
	treasure.x = 23;
	treasure.y = 73;
	mc.addChild(treasure);

	mc.snapToPixel = true;
	mc.x = mc.regX = CARD_WIDTH / 2;
	mc.y = mc.regY = CARD_HEIGHT / 2;

	return mc;
}

function getPiece(name, rotation) {
	if (rotation === undefined || rotation === -1) rotation = Math.floor(Math.random() * 4) * 90;

	var tile, treasure, bg;
	
	if (treasure_tiles[name]) {
		tile = treasure_tiles[name];
		bg = new createjs.Bitmap(queue.getResult(tile.t));
		treasure = new createjs.Bitmap(queue.getResult(name));
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
	
	piece.addChild(mc);
	
	piece.lab_meta = {
		mc: mc,
		treasure: treasure
	};
	
	return piece;
}

function getPlayerMarker(color) {
	var circle = new createjs.Shape();
	circle.graphics
		.setStrokeStyle(1)
		.beginStroke('#000000')
		.beginFill(color)
		.drawCircle(0, 0, 20);

	circle.x = circle.y = HALF_SIZE;

	var mc = new createjs.Container();

	mc.addChild(circle);
	mc.circle = circle;

	return mc;
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

function movePlayer(data) {
	var
		player = players[data.player.color],
		marker = player.marker;

	if (data.path.length <= 1) {
		// already in place, stop the scaling animation
		createjs.Tween.get(player.marker.circle, {override:true})
			.to({scaleX: 1, scaleY: 1, alpha: 0.4}, 250);
		
		return animation_done();
	}

	board.addChild(marker);

	// place marker at beginning initially
	marker.x = HALF_SIZE + player.x * TILE_SIZE;
	marker.y = HALF_SIZE + player.y * TILE_SIZE;

	// animate circle to normale size/opacity
	createjs.Tween.get(player.marker.circle, {override:true})
		.to({scaleX: 1, scaleY: 1, alpha: 1}, 250);

	// record last animation step
	$.extend(player, data.player);

	var
		path = data.path,
		idx,
		tween = createjs.Tween.get(marker);

	for (idx=1; idx<path.length-1; idx++) {
		tween = tween.to({
			x: HALF_SIZE + path[idx].x * TILE_SIZE,
			y: HALF_SIZE + path[idx].y * TILE_SIZE
		}, 500);
	}

	// go to last step
	tween
		.to({
			x: HALF_SIZE + path[idx].x * TILE_SIZE,
			y: HALF_SIZE + path[idx].y * TILE_SIZE
		}, 500)
		.call(function() {
			// place player INSIDE tile so he will ge animated for free
			grid7x7[path[idx].y][path[idx].x].addChild(marker);
			marker.x = marker.y = 0;
			createjs.Tween.get(player.marker.circle, {override:true})
				.to({alpha: 0.4}, 250);

			animation_done();
		});
}

function nextTreasure(treasure) {
	me.next_treasure = treasure;

	var
		cur_card = controls_container.card.children[0],
		nex_card = getCard(treasure);

	if (cur_card) {
		createjs.Tween.get(cur_card)
			.to(
				{
					scaleX: 0,
					scaleY: 0,
					alpha: 0
				},
				350
			);
	}

	nex_card.scaleX = nex_card.scaleY = 1.5;
	nex_card.alpha = 0;

	controls_container.card.addChild(nex_card);

	createjs.Tween.get(nex_card)
		.to(
			{
				scaleX: 1,
				scaleY: 1,
				alpha: 1
			},
			350
		)
		.call(function() {
			controls_container.card.removeChild(cur_card);
			animation_done();
		});
}

function addTriangleControls() {
	// get and position triangles
	var button = new createjs.Container();
	var mc = getTriangleGraphic();
	mc.x = 0;
	mc.y = TILE_SIZE / 2;
	button.addChild(mc);
	button.x = 0;
	button.y = HALF_SIZE + TILE_SIZE;
	button.action_data = {row_idx: 1, direction: 1};
	button.addEventListener('click', requestShift);
	button.cursor = 'pointer';
	board.addChild(button);
	buttons['y.1.1'] = button;
	
	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {row_idx: 3, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['y.3.1'] = button;

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {row_idx: 5, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['y.5.1'] = button;

	button = button.clone(true);
	button.children[0].rotation = 180;
	button.x = TILE_SIZE + GRID_SIZE * TILE_SIZE;
	button.y = HALF_SIZE + TILE_SIZE;
	button.action_data = {row_idx: 1, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['y.1.-1'] = button;

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {row_idx: 3, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['y.3.-1'] = button;

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {row_idx: 5, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['y.5.-1'] = button;

	button = button.clone(true);
	button.children[0].rotation = 90;
	button.children[0].x = TILE_SIZE / 2;
	button.children[0].y = 0;
	button.x = HALF_SIZE + TILE_SIZE;
	button.y = 0;
	button.action_data = {col_idx: 1, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['x.1.1'] = button;

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {col_idx: 3, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['x.3.1'] = button;

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {col_idx: 5, direction: 1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['x.5.1'] = button;

	button = button.clone(true);
	button.children[0].rotation = -90;
	button.x = HALF_SIZE + TILE_SIZE;
	button.y = TILE_SIZE + GRID_SIZE * TILE_SIZE;
	button.action_data = {col_idx: 1, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['x.1.-1'] = button;

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 3;
	button.action_data = {col_idx: 3, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['x.3.-1'] = button;

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 5;
	button.action_data = {col_idx: 5, direction: -1};
	button.addEventListener('click', requestShift);
	board.addChild(button);
	buttons['x.5.-1'] = button;
}

function getTriangleGraphic() {
	// create one triangle pointing right
	var g = new createjs.Graphics();
	g.beginFill("orange");
	g.moveTo(0,0);
	g.lineTo(60, 45);
	g.lineTo(0, 90);
	g.endFill();

	var shape = new createjs.Shape(g);

	shape.regX = 0;
	shape.regY = 45;

	return shape;
}
