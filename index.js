var express = require('express');
var crypto = require('crypto');
var mongoose = require('mongoose');
var user = require('./app/models/user');
var socketSession = require("express-socket.io-session");
var session = require("express-session")({
    secret: "Hnnnnnnnnnnnnnggg",
    resave: true,
    saveUninitialized: true
});
var app = express();

app.use(session);
app.set('port', (process.env.PORT || 3000));

var server = app.listen(app.get('port'), function() {
  console.log('Chatnonymous is running on port', app.get('port'));
});

var io = require('socket.io').listen(server);
io.use(socketSession(session));

mongoose.connect('mongodb://localhost/chatnonymous');

var users = {};
var markers = [];
var blacklist = [];
var chatCache = [];

app.use(express.static('dist'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var ip = (socket.handshake.headers['x-forwarded-for'] == undefined) ? 'localhost' : socket.handshake.headers['x-forwarded-for'];
  var ipHash = crypto.createHash('md5').update(ip).digest("hex");
  var sessionID = socket.handshake.sessionID;

  if(users[sessionID] === undefined) {
    users[sessionID] = {
      color: generateColor(),
      name: '',
      ip: ip,
      ipHash: ipHash,
      instances: 1,
      messages: 0
    };
    console.log(ip, 'connected');
  }
  else {
    users[sessionID].instances++;
  }

  setInterval(function() {
    if(users[sessionID]) {
      if(users[sessionID].messages >= 10 && blacklist.indexOf(ip) === -1) {
        console.log('! blacklisted:', ip);
        blacklist.push(ip);
      }
      users[sessionID].messages = 0;
    }
  }, 5000);

  // Get user name and location
  io.to(socket.id).emit('name');
  io.to(socket.id).emit('location');
  
  // Send user their color
  socket.emit('user color', users[sessionID].color);

  // Update current connections
  io.emit('users update', Object.keys(users).length);

  socket.on('map ready', function() {
      io.to(socket.id).emit('all markers', markers);
  });

  // Send chat cache
  io.to(socket.id).emit('chat history', chatCache);

  socket.on('name', function(name) {
    users[sessionID].name = name;
    console.log(name);
  });

  socket.on('chat message', function(msg) {
    console.log(ip, users[sessionID].name, ':', msg.text);
    if(blacklist.indexOf(ip) !== -1) { return; }

    users[sessionID].messages++;

    if(msg.text.length <= 140) {
      msg.name = users[sessionID].name;
      msg.color = users[sessionID].color;
      msg.persistentId = users[sessionID].ipHash;
      cacheChat(msg);
      io.emit('chat message', msg);
    }
  });

  socket.on('position', function(position) {
    deleteMarker(socket);
    position.id = socket.id;
    position.color = users[sessionID].color;
    markers.push(position);
    io.emit('add marker', position);
  });

  socket.on('disconnect', function() {
    users[sessionID].instances--;

    if(users[sessionID].instances === 0) {
      delete users[sessionID];
      console.log(ip, 'disconnected');
    }

    deleteMarker(socket);

    io.emit('users update', Object.keys(users).length);
    console.log('user disconnected with ip:', ip);
    console.log('current blacklist:', blacklist);
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