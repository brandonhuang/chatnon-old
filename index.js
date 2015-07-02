var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = 0;

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  // Generate custom color for new user
  var user_color = 'rgb(' + (Math.floor((256-229)*Math.random()) + 230) + ',' + 
                            (Math.floor((256-229)*Math.random()) + 230) + ',' + 
                            (Math.floor((256-229)*Math.random()) + 230) + ')';
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
    socket.broadcast.emit('chat message', msg);
  });
});

var port = (process.env.PORT || 3000);

http.listen(port, function() {
  console.log("listening on port", port);
});