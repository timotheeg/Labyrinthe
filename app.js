var express = require('express');
var path = require('path');
var logger = require('morgan');
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

var iorooms = io.of('/rooms');
iorooms.on('connection', function(socket) {
	// check rooms
	console.log('connection!', socket.request._query);

	var room_id = socket.request._query.room_id;
	
	if (!room_id) {
		// TODO: reject connection
		return;
	}
	
	var room = io.nsps['/rooms'].adapter.rooms[room_id];
	
	var player_idx = 0;

	if (room) {
		player_idx = room.length;
		console.log('ROOOOOM', player_idx);
		if (player_idx >= 4) {
			// room is full
			// TODO: reject connection
			return;
		}
	}
	else {
		console.log('NO ROOM');
		// TODO: create board
	}
	
	socket.join(room_id);
	
	socket.emit('registered', {player_idx: player_idx});
	
	iorooms.to(room_id).emit('new_player', {player_idx: player_idx}); // TODO: add name
});

server.listen(80);
