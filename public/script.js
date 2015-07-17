var socket = io();
var windowState, name;
var msgRate = 0;
var usersCon = 0;

$(function() {
  loadName();
  displayPageTitle();
  decrementMsgRate();
  initialize();

  $('form').on('submit', function(e) {
    processMessage();
    e.preventDefault();
  });

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

  socket.on('chat message', function(msg) {
    displayMessage(msg);
    displayPageTitle();
  });

  socket.on('chat history', function(msgs) {
    msgs.forEach(function(msg) {
      displayMessage(msg);
    });
  })

  socket.on('users update', function(users) {
    usersCon = users;
    displayUsers();
  });

  socket.on('user color', function(color) {
    displayUserColor(color);
  });

  socket.on('add marker', displayMarker);
  socket.on('delete marker', deleteMarker);
  socket.on('all markers', displayAllMarkers);

  // Mobile arrow behaviour
  $('#mobile-arrow').on('click', function() {
    $("html, body").animate({scrollTop: '0px'});
  });

  $(window).blur(function() {
    windowState = 'Inactive';
  });
  $(window).focus(function(){
    windowState = 'Active';
    displayPageTitle();
    $('#m').focus();
  });
});

// Functions
function displayMessage(msg) {
  var currentScrollBottom = $('#messages').scrollTop() + $('#messages').height();
  var currentScrollHeight = $('#messages')[0].scrollHeight;
  var tag = '';

  if(msg.name) {
    tag = $('<div class="tag" style="color: '+ msg.color +';"></div>').text(msg.name.substr(0, 12));
  } 
  $('#messages').append($('<div class="message" style="background-color: '+ msg.color +';">').text(msg.text).prepend(tag));

  if(currentScrollBottom >= currentScrollHeight - 50) {
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
  }
}

function displayUsers() {
  $('#users-online').text(usersCon);
}

function displayPageTitle() {
  if(windowState === "Inactive") {
    $('title').text('! Chatnonymous');
  }
  else {
    $('title').text('Chatnonymous');
  }
}

function displayUserColor(color) {
  $('#user-color').css('background-color', color);
}

function displayAllMarkers(positions) {
  console.log(positions);
  for(var i = 0; i < positions.length; i++) {
    displayMarker(positions[i]);
  }
}

function displayMarker(position) {
  var latlng = new google.maps.LatLng(position.latitude, position.longitude);
  var marker = new UserMarker({
    id: position.id,
    latlng: latlng,
    color: position.color,
    map: map
  });
  markers.push(marker);
}

function deleteMarker(id) {
  for(var i = 0; i < markers.length; i++) {
    if(markers[i].id == id) {
      markers[i].setMap(null);
      markers.splice(i, 1);
      break;
    }
  }
}

function fetchLocation() {
  navigator.geolocation.getCurrentPosition(geoSuccess);
}

function geoSuccess(location) {
  position = {
    latitude: Math.round(location.coords.latitude * 25)/25,
    longitude: Math.round(location.coords.longitude * 25)/25,
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

function loadName() {
  if(localStorage.getItem('name')) {
    name = localStorage.getItem('name');
    $('#tag').text(name);
  }
  else {
    name = '';
  }
}

function processMessage(event) {
  var msg = {
    text: $('#m').val(),
    name: name
  }

  if(msgRate > 3) {
    userTimeout();
  }

  socket.emit('chat message', msg);
  msgRate++;
  $('#m').val('');
}

function decrementMsgRate() {
  setInterval(function() {
    if(msgRate > 0) {
      msgRate--;
    }
  }, 3000);
}

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
  socket.emit('map ready');
  fetchLocation();
}
















