

var
	socket,
	current_player_index = -1,
	me,
	players = [],
	action_queue = [],
	animating = false;

// states
var
	i = 0,
	WAITING_REGISTER = 1 << ++i,
	WAITING_SETUP    = 1 << ++i,
	WAITING_REGISTER = 1 << ++i;

function connectSocket()
{
	socket = io.connect('/rooms', {
		query: "room_id=_r1234" + location.search.substr(1)
	});

	socket.on('registered', function (player) {
		console.log('registered', player);

		me = player;

		$('#next_treasure').css('background-image', 'url("/img/treasures/' + me.next_treasure + '.png")');

		if (me.index <= 0) {
			$('#start').show();
		}
		else {
			$('#start').hide();
		}

		$('#card, #buttons').show();
	});

	socket.on('lab_error', function (data) {
		alert('Error:' + data.reason);
	});

	socket.on('setup', function (data) {
		console.log('setup', data);

		players = data.players;

		setupBoard(data.board);
	});

	socket.on('new_player', function (data) {
		console.log('new_player!', data);

		players.push(data.player);
	});

	socket.on('next_treasure', function (treasure) {
		me.next_treasure = treasure;
		$('#next_treasure').css('background-image', 'url("/img/treasures/' + me.next_treasure + '.png")');
	});

	socket.on('board_shift', function (data) {
		action_queue.push(['board_shift', data]);
		execute();
	});

	socket.on('player_move', function (data) {
		// player is moving
		// data also tells us whether player has reached his treasure
		action_queue.push(['player_move', data]);
		execute();
	});

	socket.on('current_player', function (index) {
		current_player_index = index;
	});
}

function execute() {
	if (animating) return;
	if (!action_queue.length) return;

	animating = true;
	var action = action_queue.shift();
	switch (action[0]) {
		case 'board_shift':
			shiftTiles(action[1]);
			break;
		case 'player_move':
			movePlayer(action[1]);
			break;
	}
}

function animation_done() {
	animating = false;
	execute();
}
