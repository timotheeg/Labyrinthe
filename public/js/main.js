var GRID_TILE_SIZE = 7;
var TILE_SIZE = 135;
var HALF_SIZE = TILE_SIZE / 2;

var tiles = {
	T: 'img/tiles/T.png',
	corner: 'img/tiles/corner.png',
	straight: 'img/tiles/straight.png'
};

var tile_names = ['T', 'corner', 'straight'];

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
	
	handleComplete()
});

function handleComplete() {
	stage = new createjs.Stage("board");
	createjs.Ticker.addEventListener("tick", tick);

	
	ctrl_piece = getRandom(tile_names)
	$('#piece').append(queue.getResult(ctrl_piece));
	
	// create a dumy stage for now
	// TODO: setup fixed tiles like on the real board

	for (var row_idx=0; row_idx<GRID_TILE_SIZE; row_idx++) {
		for (var col_idx=0; col_idx<GRID_TILE_SIZE; col_idx++) {
		
			var mc = getPiece();
			mc.x = HALF_SIZE + col_idx * TILE_SIZE;
			mc.y = HALF_SIZE + row_idx * TILE_SIZE;
			mc.lab_meta.row_idx = row_idx;
			mc.lab_meta.col_idx = col_idx;
			
			grid7x7[row_idx][col_idx] = mc;
			
			if (!row_idx || !col_idx || row_idx >= GRID_TILE_SIZE-1 || col_idx >= GRID_TILE_SIZE-1) {
				mc.addEventListener('click', handleClick);
			}
			
			stage.addChild(mc);
		}
	}
	
	stage.update();
}

function tick() {
	stage.update();
}

function handleClick(evt) {
	if (animating) return;
	animating = true;

	var data = evt.currentTarget.lab_meta;
	
	// for demo purposes, x takes priority
	if (data.row_idx <= 0) {
		var piece = getPiece(ctrl_piece);
		var col_idx = data.col_idx;
		
		piece.x = HALF_SIZE + col_idx * TILE_SIZE;
		piece.y = -HALF_SIZE + data.row_idx * TILE_SIZE;
		piece.lab_meta.row_idx = data.row_idx;
		piece.lab_meta.col_idx = col_idx;
		
		stage.addChild(piece);
		
		createjs.Tween.get(piece).to({y: piece.y + TILE_SIZE}, 500).call(shiftComplete, [data, piece]);
		
		// we need to animate all pieces
		for (var row_idx=0; row_idx<GRID_TILE_SIZE; row_idx++) {
			var mc = grid7x7[row_idx][data.col_idx];
			createjs.Tween.get(mc).to({y: mc.y + TILE_SIZE}, 500);
		}
	}
}

function shiftComplete(data, piece) {
	console.log(data, piece);
	// animation is complete, now, we update the grid
	// piece that was pushed becomes new control piece
	
	var to_remove = grid7x7[GRID_TILE_SIZE-1][data.col_idx]
	
	ctrl_piece = to_remove.lab_meta.name;
	to_remove.removeEventListener('click', handleClick);
	stage.removeChild(to_remove);
	
	for (var row_idx=GRID_TILE_SIZE; row_idx-->1; ) {
		grid7x7[row_idx][data.col_idx] = grid7x7[row_idx-1][data.col_idx];
	}
	
	grid7x7[1][data.col_idx].removeEventListener('click', handleClick);

	grid7x7[0][data.col_idx] = piece
	
	piece.addEventListener('click', handleClick);
	grid7x7[GRID_TILE_SIZE-1][data.col_idx].addEventListener('click', handleClick);
	
	animating = false;
}

function getPiece(name) {
	if (!name) name = getRandom(tile_names);

	var bitmap = new createjs.Bitmap(queue.getResult(name));

	bitmap.snapToPixel = true;
	bitmap.regX = bitmap.regY = HALF_SIZE;
	bitmap.x = bitmap.y = HALF_SIZE;
	bitmap.rotation = Math.floor(Math.random() * 4) * 90;

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

// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function getRandom(arr) {
	var idx = Math.floor(Math.random() * arr.length);
	return arr[idx];
}