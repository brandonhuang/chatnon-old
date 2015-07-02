$(function() {
  var socket = io();

  $('form').submit(function() {
    message = $('#m').val();

    socket.emit('chat message', message);
    $('#messages').append($('<div class="chat">').text(message));
    $('#m').val('');
    $("#messages").animate({ scrollTop: $('#messages')[0].scrollHeight}, 350);
    return false;
  });

  socket.on('chat message', function(msg){
    $('#messages').append($('<div class="chat">').text(msg));
    $("#messages").animate({ scrollTop: $('#messages')[0].scrollHeight}, 350);
  });
});