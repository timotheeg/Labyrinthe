module.exports = Player;

function Player(player_index, socket, name, treasures) {
	this.setName(name);

	this.index = player_index;
	this.socket = socket;

	util._extend(this, Player.COLORS[player_index]);

	this.treasures = treasures;
	this.treasure_index = 0;
}

Player.COLORS = [
	{color: 'yellow', rotation:   0, row_idx: 0, col_idx: 0},
	{color: 'green',  rotation:  90, row_idx: 6, col_idx: 0},
	{color: 'blue',   rotation: 180, row_idx: 6, col_idx: 6},
	{color: 'red',    rotation: 270, row_idx: 0, col_idx: 6}
];

Player.prototype.setName = function(name) {
	this.name = name;
};
