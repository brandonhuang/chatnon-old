var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
  console.log('Chatnonymous is running on port', app.get('port'));
});

var io = require('socket.io').listen(server);
var users = 0;



app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  // Generate custom color for new user
  var user_color = 'rgb(' + (Math.floor((256-229)*Math.random()) + 210) + ',' + 
                            (Math.floor((256-229)*Math.random()) + 210) + ',' + 
                            (Math.floor((256-229)*Math.random()) + 210) + ')';
  console.log('a user connected with color', user_color);

  // Send user their color
  socket.emit('color', user_color);

  // Update current connections
  users++;
  io.emit('user connect', users);

  socket.on('disconnect', function() {
    users--;
    io.emit('user disconnect', users);
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg) {
    console.log(msg);
    io.emit('chat message', msg);
  });

  socket.on('position', function(position) {
    position.id = socket.id;
    io.emit('new position', position);
  });
});