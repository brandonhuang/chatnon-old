var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
  console.log('Chatnonymous is running on port', app.get('port'));
});

var io = require('socket.io').listen(server);

var users = [];
var locations = [];

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  // Generate custom color for new user
  var user_color = generateColor();
  console.log('a user connected with color', user_color);

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