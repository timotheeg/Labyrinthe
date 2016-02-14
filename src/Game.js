var
	utils  = require('./utils'),
	Board  = require('./board'),
	Player = require('./player');

module.exports = Game;

// states enum
var
	i = 0,
	PENDING       = 1 << ++i,
	STARTED       = 1 << ++i,
	WAITING_SHIFT = 1 << ++i,
	WAITING_MOVE  = 1 << ++i,
	STOPPED       = 1 << ++i
;

function Game(room_id, broadcaster, treasures_per_player) {
	this.room_id     = room_id;
	this.broadcaster = broadcaster;
	this.players     = [];
	this.treasures_per_player = treasures_per_player || 12;

	this._init();
}

var treasures = [
	'bat',
	'beetle',
	'book',
	'candles',
	'chest',
	'coins',
	'crown',
	'dragon',
	'fairy',
	'genie',
	'ghost',
	'helmet',
	'keys',
	'map',
	'moth',
	'mouse',
	'owl',
	'ring',
	'ruby',
	'newt',
	'skull',
	'spider',
	'sword',
	'troll'
];

// treasure deck consists of 2 cards per treasure
Game.TREASURE_DECK = treasures.concat(treasures);

Game.getTreasureDeck = function() {
	// each game gets its own copy of the deck, shuffled
	return utils.shuffle(Game.TREASURE_DECK.concat());
};

Game.prototype._init = function() {
	this.state          = PENDING
	this.turn_idx       = -1;
	this.board          = new Board();
	this.treasures_deck = Game.getTreasureDeck();
};

Game.prototype._getNextHand = function() {
	var idx = this.players.length;
	return this.treasures_deck.slice(
		this.treasures_per_player * idx,
		this.treasures_per_player * (idx + 1)
	);
};

Game.prototype.addPlayer = function(name, socket) {
	var player = new Player(
		this.players.length,
		socket,
		name,
		this._getNextHand()
	);

	// cross referencing
	this.players.push(player);
	player.setGame(this);

	// give setup info to new player
	socket.emit('setup', {
		players: this.getPlayers(),
		board:   this.getBoard().toJSON()
	});

	// inform everyone the new player has arrived
	this.broadcaster.emit('new_player', {
		player: player.toJSON()
	});

	if (this.players.length <= 1) {
		// first player joining, we make him the current
		// and we are waiting from the start signal from him
		player.setCurrent(true);
	}

	return player;
};

Game.prototype.removePlayer = function(player) {
	var idx = this.players.indexOf(player);

	this.players.splice(idx, 1);

	// brodcast the index change to all remaining players
	while (idx < this.players.length) {
		var p = this.players[idx++];
		p.index--;
		player.socket.emit('registered', p._toJSON());
	}

	if (this.players.length <= 0) {
		this._init();
		return;
	}

	// reset turn if necessary
	if (this.turn_idx >= idx) {
		this.turn_idx--;
		this.nextTurn();
	}
};

Game.prototype.isFull = function() {
	return this.players.length >= 4;
};

Game.prototype.getBoard = function() {
	return this.board;
};

Game.prototype.getPlayers = function() {
	return this.players.map(function(player) {
		return player.toJSON();
	});
};

Game.prototype.isPending = function() {
	return this.state === PENDING;
};

Game.prototype.start = function(s) {
	if (this.state != PENDING) return;

	this.nextTurn();
};

Game.prototype.stop = function() {
	this.broadcaster.emit('stop');
};

Game.prototype.nextTurn = function() {
	var player = this.players[this.turn_idx];
	if (player) player.setCurrent(false);

	this.turn_idx = (this.turn_idx + 1) % this.players.length;

	player = this.players[this.turn_idx];
	player.setCurrent(true);

	// inform everyone the new player has arrived
	this.state = WAITING_SHIFT;
	this.broadcaster.emit('current_player', this.turn_idx);
};

Game.prototype.shiftBoard = function(data) {
	if (this.state != WAITING_SHIFT) return;

	this.board.shift(data);

	this.state = WAITING_MOVE;
	this.broadcaster.emit('board_shift', data);
};

Game.prototype.movePlayer = function(player, target) {
	if (this.state != WAITING_MOVE) return;

	var path = this.board.getPath(player.x, player.y, target.x, target.y);

	if (!path) {
		// player is asking for an invalid move,
		player.socket.emit('invalid_move', {
			target: target
		});
		return;
	}

	// We have a valid path
	// check if player is acquiring his next treasure
	var tile = this.board.getTile(target.x, target.y)[0];
	console.log(tile, this.board.getTile(target.x, target.y));
	var get_treasure = false;
	if (treasures.indexOf(tile) >= 0) {
		if (player.isNextTreasure(tile)) {
			get_treasure = true;
			player.acquireTreasure();
		}
	}

	// actually move player
	player.x = target.x;
	player.y = target.y;

	// Inform everyone that player is moving
	// and whether he is getting his treasure
	var msg = {
		player: player.toJSON(),
		path:   path
	};
	if (get_treasure) msg.treasure = tile;
	this.broadcaster.emit('player_move', msg);

	this.nextTurn();
};

Game.prototype.changePlayerName = function(player, name) {
	this.broadcaster.emit('name_change', {
		player_index: player.index,
		name: name
	});
};

