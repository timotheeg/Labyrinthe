var GRID_TILE_SIZE = 7;
var TILE_SIZE = 135;
var HALF_SIZE = TILE_SIZE / 2;

var tiles = {
	T: 'img/tiles/T.png',
	c: 'img/tiles/corner.png',
	s: 'img/tiles/straight.png'
};

var tile_names = ['T', 'c', 's'];

var stage;
var queue;
var ctrl_piece;
var animating = false;

var grid7x7 = new Array(GRID_TILE_SIZE);
for (var idx=GRID_TILE_SIZE; idx--;) grid7x7[idx] = new Array(GRID_TILE_SIZE);


$(function(){
	queue = new createjs.LoadQueue(false);
	queue.on("complete", handleComplete, this);
	
	for (var key in tiles) {
		queue.loadFile({id: key, src: tiles[key]});
	}
});

function handleComplete() {
	stage = new createjs.Stage("board");
	
	stage.addChild
	
	
	ctrl_stage = new createjs.Stage("ctrl");
	createjs.Ticker.addEventListener("tick", tick);
	
	addTriangleControls();

	board_setup = JSON.parse(board_setup); // TODO make this come from server
	
	var board = board_setup.board;
	
	console.log(board_setup);

	ctrl_piece = getPiece( board_setup.ctrl );
	ctrl_piece.y = ctrl_piece.x = (191-135)/2;
	ctrl_stage.addChild(ctrl_piece);
	
	ctrl_piece.addEventListener('click', rotateControl);

	for (var row_idx=0; row_idx<GRID_TILE_SIZE; row_idx++) {
		for (var col_idx=0; col_idx<GRID_TILE_SIZE; col_idx++) {
			var mc;
			
			if (board[row_idx][col_idx]) {
				mc = getPiece(board[row_idx][col_idx][0], board[row_idx][col_idx][1]);
			}
			else {
				mc = getPiece();
			}
			mc.x = HALF_SIZE + col_idx * TILE_SIZE;
			mc.y = HALF_SIZE + row_idx * TILE_SIZE;
			mc.lab_meta.row_idx = row_idx;
			mc.lab_meta.col_idx = col_idx;
			
			grid7x7[row_idx][col_idx] = mc;
			
			stage.addChild(mc);
		}
	}
	
	tick();
}

function tick() {
	stage.update();
	ctrl_stage.update();
}

function shiftTiles(data) {
	if (animating) return;
	animating = true;

	// var piece = getPiece(ctrl_piece.lab_meta.name, ctrl_piece.lab_meta.rotation);
	var piece = ctrl_piece;
	
	stage.addChild(piece);
	
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
	animating = false;

	console.log(data, piece);
	// animation is complete, now, we update the grid
	// piece that was pushed becomes new control piece
	
	ctrl_piece.removeEventListener('click', rotateControl);
	stage.removeChild(ejected_piece);
	ctrl_stage.removeChild(ctrl_piece);
	
	ctrl_piece = ejected_piece;
	ctrl_piece.y = ctrl_piece.x = (191-135)/2;
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
}

function rotateControl(evt) {
	if (rotateControl.rotating) return;
	rotateControl.rotating = true;
	
	console.log(evt.target);
	
	var bitmap = evt.currentTarget.lab_meta.bitmap;
	createjs.Tween.get(bitmap).to({rotation: bitmap.rotation + 90}, 200).call(function() {
		evt.currentTarget.lab_meta.rotation = bitmap.rotation;
		delete rotateControl.rotating;
	});
}

function getPiece(name, rotation) {
	if (!name) name = getRandom(tile_names);
	if (rotation === undefined || rotation === -1) rotation = Math.floor(Math.random() * 4) * 90;

	var bitmap = new createjs.Bitmap(queue.getResult(name));

	bitmap.snapToPixel = true;
	bitmap.regX = bitmap.regY = HALF_SIZE;
	bitmap.x = bitmap.y = HALF_SIZE;
	bitmap.rotation = rotation;

	var mc = new createjs.Container();
	
	mc.snapToPixel = true;
	mc.addChild(bitmap);
	
	mc.lab_meta = {
		mc: mc,
		name: name,
		bitmap: bitmap,
		rotation: bitmap.rotation,
	};
	
	return mc;
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
	button.addEventListener('click', function() { shiftTiles({row_idx: 1, direction: 1}) });
	stage.addChild(button);
	
	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 3;
	button.addEventListener('click', function() { shiftTiles({row_idx: 3, direction: 1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 5;
	button.addEventListener('click', function() { shiftTiles({row_idx: 5, direction: 1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.children[0].rotation = 180;
	button.x = HALF_SIZE + GRID_TILE_SIZE * TILE_SIZE;
	button.y = HALF_SIZE + TILE_SIZE;
	button.addEventListener('click', function() { shiftTiles({row_idx: 1, direction: -1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 3;
	button.addEventListener('click', function() { shiftTiles({row_idx: 3, direction: -1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.y = HALF_SIZE + TILE_SIZE * 5;
	button.addEventListener('click', function() { shiftTiles({row_idx: 5, direction: -1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.children[0].rotation = 90;
	button.children[0].x = TILE_SIZE / 2;
	button.children[0].y = HALF_SIZE / 2;
	button.x = HALF_SIZE + TILE_SIZE;
	button.y = 0;
	button.addEventListener('click', function() { shiftTiles({col_idx: 1, direction: 1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 3;
	button.addEventListener('click', function() { shiftTiles({col_idx: 3, direction: 1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 5;
	button.addEventListener('click', function() { shiftTiles({col_idx: 5, direction: 1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.children[0].rotation = -90;
	button.x = HALF_SIZE + TILE_SIZE;
	button.y = HALF_SIZE + GRID_TILE_SIZE * TILE_SIZE;
	button.addEventListener('click', function() { shiftTiles({col_idx: 1, direction: -1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 3;
	button.addEventListener('click', function() { shiftTiles({col_idx: 3, direction: -1}) });
	stage.addChild(button);

	button = button.clone(true);
	button.x = HALF_SIZE + TILE_SIZE * 5;
	button.addEventListener('click', function() { shiftTiles({col_idx: 5, direction: -1}) });
	stage.addChild(button);
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

function getRandom(arr) {
	var idx = Math.floor(Math.random() * arr.length);
	return arr[idx];
}