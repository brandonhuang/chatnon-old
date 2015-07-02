$(function() {
  var socket = io();
  var userColor;

  $('form').submit(function() {
    message = $('#m').val();

    socket.emit('chat message', message);
    $('#messages').append($('<div class="chat" style="background-color: '+ userColor +';">').text(message));
    $('#m').val('');
    $("#messages").animate({ scrollTop: $('#messages')[0].scrollHeight}, 350);
    return false;
  });

  socket.on('chat message', function(msg){
    $('#messages').append($('<div class="chat" style="background-color: '+ userColor +';">').text(msg));
    $("#messages").animate({ scrollTop: $('#messages')[0].scrollHeight}, 350);
  });

  socket.on('color', function(color){
    userColor = color;
  });
});