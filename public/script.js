$(function() {
  var socket = io();
  var userColor;

  $('form').submit(function() {
    msg = {
      text: $('#m').val(),
      userColor: userColor
    }

  socket.emit('chat message', msg);
  $('#m').val('');
  return false;
  });

  socket.on('chat message', function(msg){
    displayMessage(msg);
    $("#messages").animate({scrollTop: $('#messages')[0].scrollHeight}, 350);
  });

  socket.on('color', function(color){
    userColor = color;
  });

  socket.on('user connect', function(users) {
    displayUsers(users);
  });

  socket.on('user disconnect', function(users) {
    displayUsers(users);
  });

  socket.on('new position', function(position) {
    console.log(position);
  });

  // Geolocation
  navigator.geolocation.getCurrentPosition(geoSuccess);

  // Functions
  function displayMessage(msg) {
    $('#messages').append($('<div class="chat" style="background-color: '+ msg.userColor +';">').text(msg.text));
  }

  function displayUsers(users) {
    $('#users').text(users);
  }

  function geoSuccess(location) {
    position = {
      latitude: location.coords.latitude,
      longitute: location.coords.longitude
    };
    socket.emit('position', position);
  };
});
