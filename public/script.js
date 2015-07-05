$(function() {
  var socket = io();
  var userId;
  var userColor;
  var msgRate = 0;
  var state;

  // Grab name from localStorage if exists
  if (localStorage.name) {
    var name = localStorage.getItem('name');
    $('#tag').text(name);
  }
  else {
    var name = '';
  }

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
  }, 3000);

  // Usernames
  $('#tag').on('blur', function() {
    name = $(this).text();
    localStorage.setItem('name', name);
  });
  $('#tag').on('keypress', function(e) {
    if($(this).text().length >= 12) {
      e.preventDefault();
    }
  });

  socket.on('chat message', function(msg){
    var currentScrollBottom = $('#messages').scrollTop() + $('#messages').height();
    var currentScrollHeight = $('#messages')[0].scrollHeight;

    displayMessage(msg);
    displayNotification();

    if(currentScrollBottom === currentScrollHeight) {
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    }
  });

  socket.on('color', function(color){
    userColor = color;
    displayUserColor();
  });

  socket.on('users update', function(users) {
    displayUsers(users);
  });

  socket.on('id', function(id) {
    userID = id;
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
    var tag = '';
    if(msg.name) {
      tag = $('<div class="tag" style="color: '+ msg.userColor +';"></div>').text(msg.name.substr(0, 12));
    } 
    $('#messages').append($('<div class="message" style="background-color: '+ msg.userColor +';">').text(msg.text).prepend(tag));
  }

  function displayUsers(users) {
    $('#users-online').text(users);
  }

  function displayNotification() {
    if(state === "Inactive") {
      $('title').text('! Chatnonymous');
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
    $('#messages').append($('<div class="chat" style="background-color: white; color: #c0392b; padding: 20px 0;">').text('You have been timed out for 60 seconds'));
    $('#m').addClass('timeout').prop('disabled', true);
    setTimeout(function() {
      $('#m').removeClass('timeout').prop('disabled', false);
    }, 60000);

  }
});

// Google Maps Code
var map;
var markers = [];

function initialize() {
  var mapOptions = {
    center: { lat: 0, lng: 0},
    zoom: 2,
    disableDefaultUI: true,
    zoomControl: true
  };
  map = new google.maps.Map(document.getElementById('map-container'), mapOptions);

}

google.maps.event.addDomListener(window, 'load', initialize);
















