var util = require('util');

module.exports = Player;

function Player(player_index, socket, name, treasures) {
	this.name = name;
	this.index = player_index;
	this.socket = socket;
	this.is_current_player = false;

	util._extend(this, Player.COLORS[player_index]);

	this.treasures = treasures;
	this.collected = 0;

	this.listens();

	socket.emit('registered', this._toJSON());
}

Player.COLORS = [
	{color: 'yellow', rotation:   0, x: 0, y: 0},
	{color: 'green',  rotation:  90, x: 0, y: 0},
	{color: 'blue',   rotation: 180, x: 6, y: 6},
	{color: 'red',    rotation: 270, x: 6, y: 0}
];

Player.prototype.setGame = function(game) {
	this.game = game;
};

Player.prototype.setCurrent = function(is_current) {
	this.is_current_player = is_current;
};

Player.prototype.isCurrentPlayer = function() {
	return this.is_current_player;
};

// public json
Player.prototype.toJSON = function() {
	return {
		x:         this.x,
		y:         this.y,
		index:     this.index,
		color:     this.color,
		collected: this.collected,
		done:      this.isDone()
	};
};

// private JSON
Player.prototype._toJSON = function() {
	var data = this.toJSON();

	data.rotation = this.rotation,
	data.next_treasure = this.treasures[this.collected];

	return data;
};

Player.prototype.isDone = function() {
	return this.collected >= this.treasures.length;
};

Player.prototype.isNextTreasure = function(treasure) {
	return treasure == this.treasures[this.collected];
};

Player.prototype.acquireTreasure = function() {
	this.socket.emit(
		'next_treasure',
		this.treasures[++this.collected]
	);
};

Player.prototype.listens = function() {
	var self = this;

	this.socket.on('disconnect', function() {
		self.game.removePlayer(self);
	});

	this.socket.on('start', function() {
		if (!self.isCurrentPlayer()) return;

		self.game.start();
	});

	this.socket.on('change_name', function(name) {
		self.game.changePlayerName(player, self.name = name);
	});

	this.socket.on('shift', function(data) {
		console.log('shift', self.isCurrentPlayer());
		if (!self.isCurrentPlayer()) return;

		self.game.shiftBoard(data);
	});

	this.socket.on('move', function(target) {
		if (!self.isCurrentPlayer()) return;

		self.game.movePlayer(self, target);
	});
};
