var
	util   = require('util'),
	utils  = require('./utils'),
	Board  = require('./board'),
	Player = require('./player');

module.exports = Game;

function Game(room_id, treasure_per_player) {
	this.room_id = room_id;
	this.players = [];
	this.turn_idx = 0;
	this.board = new Board();
	this.treasures_deck = Game.getTreasureDeck();
	this.treasure_per_player = treasure_per_player || 12;
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

Game.prototype.getNextHand = function() {
	var idx = this.players.length;
	return treasures_deck.slice(
		this.treasure_per_player * idx,
		this.treasure_per_player * (idx + 1)
	);
};

Game.prototype.addPlayer = function(name, socket) {
	var player = new Player(
		this.players.length,
		socket,
		name,
		this.getNextHand()
	);

	this.players.push(player);

	return player;
};

Game.prototype.start = function(name) {
	this.promptPlayer();
};

Game.prototype.stop = function() {
};

Game.prototype.promptPlayer = function() {
	var player = this.players[this.turn_idx];
	player.prompt();
};

Game.prototype.nextTurn = function(name) {
	this.turn_idx = (this.turn_idx + 1) % this.players.length;
	this.promptPlayer();
};

Game.prototype.shiftBoard = function(data) {

};

Game.prototype.movePlayer = function(target) {

};

