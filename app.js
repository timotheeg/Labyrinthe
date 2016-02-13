var express = require('express');
var path = require('path');
var logger = require('morgan');

var Game = require('./src/Game');

// var favicon = require('serve-favicon');
// var routes = require('./routes/index');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);

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

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});


var rooms = new Map();

var iorooms = io.of('/rooms');
iorooms.on('connection', function(socket) {
	// check rooms
	console.log('connection!', socket.request._query);

	var room_id = socket.request._query.room_id;
	var name = socket.request._query.name || 'bob';
	
	if (!room_id) {
		// TODO: reject connection
		return;
	}
	
	var room = io.nsps['/rooms'].adapter.rooms[room_id];
	
	var player_idx = 0;
	var game;

	if (!room) {
		game = new Game(room_id, iorooms.to(room_id));
		rooms.set(room_id, game);
	}
	else {
		game = rooms.get(room_id);

		if (!game.isPending()) {
			return socket.emit('lab_error', {room_id: room_id, reason: 'STARTED'});
		}

		player_idx = room.length;
		if (player_idx >= 4) {
			// room is full, inform client and abort
			return socket.emit('lab_errorss', {room_id: room_id, reason: 'FULL'});
		}
	}

	socket.join(room_id);

	game.addPlayer(name, socket);
});

server.listen(80);
