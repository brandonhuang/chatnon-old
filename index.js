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
  var ip = socket.handshake.headers['x-forwarded-for'];
  console.log('user connected with ip:', ip);
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
    console.log('user disconnected with ip:', ip);
  });

  socket.on('chat message', function(msg) {
    if(blacklist.indexOf(ip) !== -1 || ip === undefined) { return; }

    messages++;
    var now = (new Date().getTime() / 1000) + 1;
    var msgsPerSecond = messages / (now - startInterval);
    
    if(msgsPerSecond > 2 && blacklist.indexOf(ip) === -1) {
      console.log('blacklisted', ip);
      blacklist.push(ip);
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

function getClientIp(req) {
  var ipAddress;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if (forwardedIpsStr) {
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};