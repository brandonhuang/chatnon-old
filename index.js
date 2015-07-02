var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var user_color = 'rgb(' + (Math.floor((256-229)*Math.random()) + 230) + ',' + 
                            (Math.floor((256-229)*Math.random()) + 230) + ',' + 
                            (Math.floor((256-229)*Math.random()) + 230) + ')';

  socket.emit('color', user_color);
  console.log('a user connected with color', user_color);

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg) {
    socket.broadcast.emit('chat message', msg);
  });
});

var port = (process.env.PORT || 3000);

http.listen(port, function() {
  console.log("listening on port", port);
});