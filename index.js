var express = require('express');
var crypto = require('crypto');
var mongoose = require('mongoose');
var User = require('./app/models/user');
var socketSession = require("express-socket.io-session");
var session = require("express-session")({
    secret: "Hnnnnnnnnnnnnnggg",
    resave: true,
    saveUninitialized: true
});
var app = express();

app.use(session);
app.set('port', 80);

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

app.use(express.static(__dirname + '/dist/'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var ip = socket.handshake.address;
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

  socket.on('set name', function(userObj) {
    if(userObj.name === '') {
      users[sessionID].name = '';
      io.to(socket.id).emit('name remove', '');
      return;
    }


    var result = searchName(userObj.name, users);
    if(result) {
      io.to(socket.id).emit('name fail');
      console.log('someone else is using that name');
      return;
    }

    User.findOne({ username: userObj.name }, function(err, user) {
      if(err) throw err;

      if(!user) {
        users[sessionID].name = userObj.name;
        console.log('set name success for', userObj.name);
        io.to(socket.id).emit('name success', userObj.name);
      }
      else {
        user.verifyPassword(userObj.password, function(err, isMatch) {
          if(err) throw err;

          if(isMatch) {
            users[sessionID].name = userObj.name;
            console.log(userObj.name, 'has signed in');
            io.to(socket.id).emit('name success', userObj.name);
            io.to(socket.id).emit('lock success', userObj);
          }
          else {
            io.to(socket.id).emit('name fail');
            console.log('password is incorrect');
          }
        });
      }
    });
  });

  socket.on('lock name', function() {
    if(users[sessionID].name === '') return;

    User.findOne({ username: users[sessionID].name }, function(err, user) {
      if(err) throw err;

      if(!user) {
        var newUser = User({
          username: users[sessionID].name,
          password: users[sessionID].ipHash 
        });
        newUser.save(function(err, user) {
          if(err) throw err;

          console.log(user.username, 'has been locked');
          io.to(socket.id).emit('lock success', { name: user.username, password: users[sessionID].ipHash });
        });
      }
    });
  });

  socket.on('unlock name', function(userObj) {
    User.findOne({ username: userObj.name }, function(err, user) {
      if(err) throw err;

      if(user) {
        user.verifyPassword(userObj.password, function(err, isMatch) {
          if(err) throw err;

          if(isMatch) {
            user.remove(function(err) {
              if(err) throw err;

              io.to(socket.id).emit('unlock success');
              console.log(userObj.name, 'has been unlocked')
            })
          }
        });
      }
    });
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

function searchName(name, obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      if(obj[prop].name === name) {
        return prop;
      }
    }
  }
}