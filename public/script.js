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

  socket.on('users update', function(users) {
    displayUsers(users);
  });

  socket.on('locations update', function(locations) {
    console.log(locations);

    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];

    locations.forEach(function(position) {
      marker = new google.maps.Marker({
        position: { lat: position.latitude, lng: position.longitude },
        map: map,
        animation: google.maps.Animation.DROP
      });

      markers.push(marker);
    });
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
      longitude: location.coords.longitude
    };
    socket.emit('position', position);
  };
});

// Google Maps Code
var map;
var markers = [];

function initialize() {
  var mapOptions = {
    center: { lat: 49.863735, lng: -100.556513 },
    zoom: 3,
    disableDefaultUI: true
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);

}

google.maps.event.addDomListener(window, 'load', initialize);


















