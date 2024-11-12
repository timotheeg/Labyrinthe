var
	utils  = require('./utils'),
	Board  = require('./Board'),
	Player = require('./Player');

module.exports = Game;

var GRID_SIZE = 7;

// states enum
var
	i = 0,
	PENDING       = 1 << i++,
	STARTED       = 1 << i++,
	WAITING_SHIFT = 1 << i++,
	WAITING_MOVE  = 1 << i++,
	STOPPED       = 1 << i++
;

function Game(room_id, broadcaster, treasures_per_player) {
	console.log(`NEW GAME: ${room_id}`);

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
	// each game gets its own copy of the deck, shuffled, with no player-wide repeats
	var
		half_deck_1 = utils.shuffle(treasures.concat()),
		half_deck_2 = utils.shuffle(treasures.concat());

	return half_deck_1.concat(half_deck_2);
};

Game.prototype._init = function() {
	this.state          = PENDING;
	this.turn_idx       = -1;
	this.board          = new Board(GRID_SIZE);
	this.treasures_deck = Game.getTreasureDeck();
	this.last_move      = {row_idx: 0, direction: 0};
};

Game.prototype._getNextHand = function() {
	var idx = this.players.length;
	return this.treasures_deck.slice(
		this.treasures_per_player * idx,
		this.treasures_per_player * (idx + 1)
	);
};

Game.prototype.attemptRejoin = function(name, client_id, socket) {
	console.log("attemptRejoin");

	const player = this.players.find(p => p.client_id === client_id);
	if (!player) return null;

	// this IS a rejoin, need to adjust the player and give it the setup
	socket.join(this.room_id);

	player._removeTO = clearTimeout(player._removeTO);
	player.socket = socket;
	player.listens();

	// give the player everything needed to reset
	socket.emit('registered', player._toJSON());
	socket.emit('setup', {
		players: this.getPlayers(),
		board:   this.getBoard().toJSON()
	});

	// if the player is next to play, need to inform him now
	if (this.turn_idx === player.index) {
		// dang it, it's the current player turn, let's check what's the state...
		player.setCurrent(true);

		if (this.state = WAITING_SHIFT) {
			this.broadcaster.emit('current_player', this.turn_idx);
		}
		else if (this.state = WAITING_MOVE) {
			// Player was supposed to move, but too bad, we take reconnection as give up your turn penalty 🤷
			this.nextTurn();
		}
	}

	return player;
}

Game.prototype.addPlayer = function(name, client_id, socket) {
	// create the new player object
	socket.join(this.room_id);

	var player = new Player(
		client_id,
		this.players.length,
		socket,
		name,
		this._getNextHand()
	);

	// cross referencing
	player.setGame(this);

	// give setup info to new player
	socket.emit('setup', {
		players: this.getPlayers(),
		board:   this.getBoard().toJSON()
	});

	// inform everyone the new player has arrived
	this.players.push(player);
	this.broadcaster.emit('new_player', player.toJSON());

	if (this.players.length <= 1) {
		// first player joining, we make him the current
		// and we are waiting from the start signal from him
		player.setCurrent(true);
	}

	return player;
};

Game.prototype.scheduleRemovePlayer = function(player) {
	console.log('scheduleRemovePlayer');
	player._removeTO = setTimeout(() => {
		this.removePlayer(player);
	}, 120000)
}

Game.prototype.removePlayer = function(player) {
	console.log('removePlayer');
	// Warning: this doesn't work during a game
	// TODO: make this more resilient
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

	this.broadcaster.emit('start');
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

	if (!player.isDone()) {
		player.setCurrent(true);
		this.state = WAITING_SHIFT;
		this.broadcaster.emit('current_player', this.turn_idx);
	}
	else {
		// check if there's any player left who is not done
		for (var idx=this.players.length; idx--;) {
			if (!this.players[idx].isDone()) return this.nextTurn();
		}

		// Game Over, all players are done!
		this.state = STOPPED;
		this.broadcaster.emit('game_over', this.turn_idx);
	}
};

Game.prototype.shiftBoard = function(data) {
	if (this.state != WAITING_SHIFT) return;

	var prop = 'row_idx' in data ? 'row_idx' : 'col_idx';

	if (data[prop] === this.last_move[prop] && data.direction === this.last_move.direction * -1) {
		// trying to reverse last move... No, no, no!
		return this.players[this.turn_idx].socket.emit('shift_not_allowed', 'REVERSE_SHIFT');
	}

	this.board.shift(data);

	// players that were on a moving cells need to be udpated as well
	this.players.forEach(function(player) {
		if ('row_idx' in data) {
			if (player.y == data.row_idx) {
				player.x = (player.x + data.direction + GRID_SIZE) % GRID_SIZE;
			}
		}
		else {
			if (player.x == data.col_idx) {
				player.y = (player.y + data.direction + GRID_SIZE) % GRID_SIZE;
			}
		}
	});

	this.last_move = data;
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

	// check if player is acquiring his next treasure
	var tile = this.board.getTile(target.x, target.y)[0];
	var get_treasure = false;
	if (treasures.indexOf(tile) >= 0) {
		if (player.isNextTreasure(tile)) {
			get_treasure = true;
			player.acquireTreasure();
		}
	}

	if (get_treasure) {
		this.broadcaster.emit('player_gets_treasure', {
			player: player.toJSON(),
			treasure: tile
		});
	}

	this.nextTurn();
};

Game.prototype.changePlayerName = function(player, name) {
	this.broadcaster.emit('name_change', {
		player_index: player.index,
		name: name
	});
};

