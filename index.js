var express = require('express');
var app = express();
var crypto = require('crypto');

app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
  console.log('Chatnonymous is running on port', app.get('port'));
});

var io = require('socket.io').listen(server);

var users = 0;
var markers = [];
var blacklist = [];
var chatCache = [];




app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var messages = 0;
  var ip = socket.handshake.headers['x-forwarded-for'];
  socket.id = crypto.createHash('md5').update(typeof(ip)).digest("hex")
  console.log('user connected with ip:', ip);

  var user = {
    color: generateColor(),
    id: socket.id
  }

  setInterval(function() {
    if(messages >= 20 && blacklist.indexOf(ip) === -1) {
      console.log('! blacklisted:', ip);
      blacklist.push(ip);
    }
    messages = 0;
  }, 10000);

  // Send user their color
  socket.emit('user color', user.color);

  // Update current connections
  users++;
  io.emit('users update', users);

  socket.on('map ready', function() {
      io.to(socket.id).emit('all markers', markers);
  });

  // Send chat cache
  io.to(socket.id).emit('chat history', chatCache);

  socket.on('disconnect', function() {
    users--;
    deleteMarker(socket);

    io.emit('users update', users);
    console.log('user disconnected with ip:', ip);
    console.log('current blacklist:', blacklist);
  });

  socket.on('chat message', function(msg) {
    console.log(ip, msg);
    if(blacklist.indexOf(ip) !== -1) { return; }

    messages++;

    if(msg.text.length <= 140) {
      msg.color = user.color;
      msg.id = user.id
      cacheChat(msg);
      io.emit('chat message', msg);
    }
  });

  socket.on('position', function(position) {
    deleteMarker(socket);
    position.id = socket.id;
    position.color = user.color;
    markers.push(position);
    io.emit('add marker', position);
  });
});

function generateColor() {
  var hue = Math.floor(Math.random() * 360);
  var sat = Math.floor(Math.random() * 20 + 40);
  var lum = Math.floor(Math.random() * 20 + 40);
  var color = 'hsl('+ hue +', '+ sat +'%, '+ lum +'%)';
  return color;
}

function deleteMarker(socket) {
  for(var i = 0; i < markers.length; i++) {
    if(markers[i].id == socket.id) {
      markers.splice(i, 1);
    }
  }
  io.emit('delete marker', socket.id);
}

function cacheChat(msg) {
  if(chatCache.length >= 25) {
    chatCache.shift();
    chatCache.push(msg);
  }
  else {
    chatCache.push(msg);
  }
}