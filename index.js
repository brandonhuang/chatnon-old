var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
  console.log('Chatnonymous is running on port', app.get('port'));
});

var io = require('socket.io').listen(server);

var users = 0;
var locations = [];
var blacklist = [];

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected with IP:', socket.request.socket.remoteAddress);
  var startInterval = new Date().getTime() / 1000;
  var messages = 0;

  setInterval(function() {
    startInterval = new Date().getTime() / 1000;
    messages = 0;
  }, 5000);

  // Generate custom color for new user
  var user_color = generateColor();

  // Send user their color
  socket.emit('color', user_color);

  // Update current connections
  users++;
  io.emit('users update', users);

  socket.on('disconnect', function() {
    users--;

    for(var i = 0; i < locations.length; i++) {
      if(locations[i].id == socket.id) {
        locations.splice(i, 1);
        break;
      }
    }

    io.emit('locations update', locations);
    io.emit('users update', users);
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg) {
    // if(blacklist.indexOf(socket.request.connection.remoteAddress) !== -1 || socket.request.connection.remoteAddress === undefined) { return; }

    messages++;
    var now = (new Date().getTime() / 1000) + 1;
    var msgsPerSecond = messages / (now - startInterval);
    
    if(msgsPerSecond > 2 && blacklist.indexOf(socket.request.connection.remoteAddress) === -1) {
      console.log('blacklisted', socket.request.connection.remoteAddress);
      blacklist.push(socket.request.connection.remoteAddress);
    }

    var hslpat = /hsl\(\d+,\s*[\d.]+%,\s*[\d.]+%\)/;
    if(hslpat.test(msg.userColor) && msg.text.length <= 140) {
      io.emit('chat message', msg);
    }
  });

  socket.on('position', function(position) {
    position.id = socket.id;
    position.longitude = Math.round(position.longitude * 100)/100;
    position.latitude = Math.round(position.latitude * 100)/100;
    locations.push(position);
    io.emit('locations update', locations);
  });
});

function generateColor() {
  var hue = Math.floor(Math.random() * 360);
  var sat = Math.floor(Math.random() * 20 + 40);
  var lum = Math.floor(Math.random() * 20 + 40);
  var color = 'hsl('+ hue +', '+ sat +'%, '+ lum +'%)';
  return color;
}