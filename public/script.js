$(function() {
  var socket = io();
  var userColor;
  var msgRate = 0;
  var state;
  var name = '';

  $('form').submit(function() {
    msg = {
      text: $('#m').val(),
      userColor: userColor,
      name: name
    }

    if(msgRate > 3) {
      userTimeout();
    }

  socket.emit('chat message', msg);
  msgRate++;
  $('#m').val('');
  return false;
  });

  // Rate Limiting
  setInterval(function() {
    if(msgRate > 0) {
      msgRate--;
    }
  }, 1000);

  // Usernames
  $('#username').on('blur', function() {
    name = $(this).val();
  });

  socket.on('chat message', function(msg){
    displayMessage(msg);
    displayNotification();
    $("#messages").scrollTop($('#messages')[0].scrollHeight);
  });

  socket.on('color', function(color){
    userColor = color;
    displayUserColor();
  });

  socket.on('users update', function(users) {
    displayUsers(users);
  });

  socket.on('locations update', function(locations) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];

    locations.forEach(function(position) {
      marker = new google.maps.Marker({
        position: { lat: position.latitude, lng: position.longitude },
        map: map
      });

      markers.push(marker);
    });
  });

  $('#mobile-arrow').on('click', function() {
    $("html, body").animate({scrollTop: '0px'});
  });

  $(window).blur(function(){
    state = 'Inactive';
  });
  $(window).focus(function(){
    state = 'Active';
    $('title').text('Chatnonymous');
  });

  // Geolocation
  navigator.geolocation.getCurrentPosition(geoSuccess);

  // Functions
  function displayMessage(msg) {
    var message = '';
    if(msg.name !== '' || msg.name !== undefined) {
      message += '[ '+ msg.name +' ] ';
    }
    message += msg.text;
    $('#messages').append($('<div class="chat" style="background-color: '+ msg.userColor +';">').text(message));
  }

  function displayUsers(users) {
    $('#users-online').text(users);
  }

  function displayNotification() {
    if(state === "Inactive") {
      $('title').text('* Chatnonymous');
    }
  }

  function displayUserColor() {
    $('#user-color').css('background-color', userColor);
  }

  function geoSuccess(location) {
    position = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
    socket.emit('position', position);
  };
  function userTimeout() {
    $('#messages').append($('<div class="chat" style="background-color: #c0392b; color: white;">').text('You have been timed out for 30 seconds'));
    $('#m').addClass('timeout').prop('disabled', true);
    setTimeout(function() {
      $('#m').removeClass('timeout').prop('disabled', false);
    }, 30000);

  }
});

// Google Maps Code
var map;
var markers = [];

function initialize() {
  var mapOptions = {
    center: { lat: 49.863735, lng: -100.556513 },
    zoom: 3,
    disableDefaultUI: true,
    zoomControl: true
  };
  map = new google.maps.Map(document.getElementById('map-container'), mapOptions);

}

google.maps.event.addDomListener(window, 'load', initialize);


















