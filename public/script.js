$(function() {
  var socket = io();
  var userColor;

  $('form').submit(function() {
    msg = {
      text: $('#m').val(),
      userColor: userColor
    }

  socket.emit('chat message', msg);
    displayMessage(msg);
    $('#m').val('');
    $("#messages").animate({scrollTop: $('#messages')[0].scrollHeight}, 350);
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
    console.log(users);
    displayUsers(users);
  });

  socket.on('user disconnect', function(users) {
    displayUsers(users);
  });
});

function displayMessage(msg) {
  $('#messages').append($('<div class="chat" style="background-color: '+ msg.userColor +';">').text(msg.text));
}

function displayUsers(users) {
  $('#users').text(users);
}