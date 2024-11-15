var express = require('express');
var path = require('path');
var logger = require('morgan');

var Game = require('./src/Game');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(logger('dev'));

app.get('/r/:id', function (req, res) {
	console.log('foo')
	res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
else {
	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});
}


var rooms = new Map();

var iorooms = io.of('/rooms');
iorooms.on('connection', function(socket) {
	// check rooms
	console.log('connection!', socket.request._query);
	console.log('connection!', socket.id);

	var room_id = socket.request._query.room_id;
	var client_id = socket.request._query.client_id;
	var name = socket.request._query.name || 'bob';
	
	if (!room_id) {
		// TODO: reject connection
		return;
	}
	
	// console.log(io.nsps['/rooms'].adapter.rooms);
	var room = io.nsps['/rooms'].adapter.rooms[room_id];

	var game = rooms.get(room_id);

	if (!game) {
		game = new Game(room_id, iorooms.to(room_id));
		rooms.set(room_id, game);
	}
	else {
		// check if player is reconnecting
		if (game.attemptRejoin(name, client_id, socket)) {
			return;
		}

		if (!game.isPending()) {
			return socket.emit('lab_error', {room_id: room_id, reason: 'STARTED'});
		}

		if (game.isFull()) {
			// room is full, inform client and abort
			return socket.emit('lab_error', {room_id: room_id, reason: 'FULL'});
		}
	}

	game.addPlayer(name, client_id, socket);
});

server.listen(30001);
