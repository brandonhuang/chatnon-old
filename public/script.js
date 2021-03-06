var socket = io();
var windowState;
var msgRate = 0;
var usersCon = 0;
var muteList = [];

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
    var name = $(this).text();
    socket.emit('name', name);
    localStorage.setItem('name', name);
  });
  $('#tag').on('keypress', function(e) {
    if($(this).text().length >= 12) {
      e.preventDefault();
    }
  });

  socket.on('name', function() {
    var name = $('#tag').text();
    socket.emit('name', name);
  });

  socket.on('location', function() {
    fetchLocation();
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
  if(muteList.indexOf(msg.persistentId) !== -1) {
    return;
  }

  var currentScrollBottom = $('#messages').scrollTop() + $('#messages').height();
  var currentScrollHeight = $('#messages')[0].scrollHeight;
  var tag = '';

  if(msg.name) {
    tag = $('<div class="tag" style="color: '+ msg.color +';" onclick="muteUser(&quot;'+ String(msg.persistentId) +'&quot;);"></div>').text(msg.name.substr(0, 12));
  }
  else {
    tag = $('<div class="tag" style="color: #ecf0f1;" onclick="muteUser(&quot;'+ String(msg.persistentId) +'&quot;);"></div>').text("?");
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
    var name = localStorage.getItem('name');
    // socket.emit('name', name);
    $('#tag').text(name);
  }
}

function processMessage(event) {
  var msg = {
    text: $('#m').val()
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

function muteUser(persistentId) {
  if(muteList.indexOf(persistentId) === -1 && confirm('Are you sure you want to mute this user?')) {
    muteList.push(persistentId);
  }
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
}














