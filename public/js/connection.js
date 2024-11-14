

var
	socket,
	me,
	action_queue = [],
	animating = false;

// states
var
	i = 0,
	WAITING_REGISTER = 1 << ++i,
	WAITING_SETUP    = 1 << ++i,
	WAITING_REGISTER = 1 << ++i;

function getRoomId() {
	return location.pathname.split('/').pop();
}

function generateUniqSerial() {
	return 'xxxx-xxxx-xxx-xxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));
}

function getClientId() {
	const roomid = getRoomId();
	const storeKey = `${roomid}-clientid`
	let clientid = sessionStorage.getItem(storeKey);

	if (!clientid) {
		clientid = crypto?.randomUUID?.() || generateUniqSerial();
		sessionStorage.setItem(storeKey, clientid);
	}

	return clientid;
}

function connectSocket()
{
	// extract room id from query string
	const roomid = getRoomId();
	const clientid = getClientId();

	socket = io.connect('/rooms', {
		query: `room_id=_r${roomid}&client_id=${clientid}`
	});

	socket.on('registered', function (player) {
		console.log('registered', player);

		me = player;

		if (me.index <= 0) {
			// TODO: show start button
		}

		nextTreasure(me.next_treasure);
	});

	socket.on('lab_error', function (data) {
		alert('Error:' + data.reason);
	});

	socket.on('setup', function (data) {
		console.log('setup', data);

		setupBoard(data.board);

		data.players.forEach(setupPlayer);
	});

	socket.on('new_player', function (player) {
		console.log('new_player!', player);

		setupPlayer(player);
	});

	socket.on('start', start);

	socket.on('next_treasure', function (data) {
		action_queue.push(['next_treasure', data]);
		execute();
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

	socket.on('player_gets_treasure', function (data) {
		// player is moving
		// data also tells us whether player has reached his treasure
		action_queue.push(['player_gets_treasure', data]);
		execute();
	});

	socket.on('current_player', function (data) {
		action_queue.push(['current_player', data]);
		execute();
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
		case 'player_gets_treasure':
			playerGetsTreasure(action[1]);
			break;
		case 'next_treasure':
			nextTreasure(action[1]);
			break;
		case 'current_player':
			setCurrentPlayer(action[1]);
			break;
	}
}

function animation_done() {
	animating = false;
	execute();
}
