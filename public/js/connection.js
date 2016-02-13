var socket = io.connect('/rooms', {
	query: "room_id=_r1234" + location.search.substr(1)
});

socket.on('registered', function (data) {
	console.log('registered!', data);
});