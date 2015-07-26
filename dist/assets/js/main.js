function UserMarker(marker) {
  this.id = marker.id;
  this.latlng = marker.latlng; 
  this.color = marker.color;
  this.setMap(marker.map); 
}
 
UserMarker.prototype = new google.maps.OverlayView();
 
UserMarker.prototype.draw = function() {
  
  var self = this;
  
  var div = this.div;
  
  if (!div) {
  
    div = this.div = document.createElement('div');
    
    div.className = 'marker';
    
    div.style.position = 'absolute';
    div.style.background = this.color;
    
    google.maps.event.addDomListener(div, "click", function(event) {      
      google.maps.event.trigger(self, "click");
    });
    
    var panes = this.getPanes();
    panes.overlayImage.appendChild(div);
  }
  
  var point = this.getProjection().fromLatLngToDivPixel(this.latlng);
  
  if (point) {
    div.style.left = (point.x) + 'px';
    div.style.top = (point.y) + 'px';
  }
};
 
UserMarker.prototype.remove = function() {
  if (this.div) {
    this.div.parentNode.removeChild(this.div);
    this.div = null;
  } 
};
 
UserMarker.prototype.getPosition = function() {
  return this.latlng; 
};
var socket = io();
var windowState;
var msgRate = 0;
var usersCon = 0;
var muteList = [];
var locked = false;

$(function() {
  socket.on('init', function() {
    loadName();
    displayPageTitle();
    decrementMsgRate();
    initialize();
    fetchLocation();
  });

  $('form').on('submit', function(e) {
    processMessage();
    e.preventDefault();
  });

  // Usernames
  $('#tag').on('blur', function() {
    var userObj = {
      name: $(this).text(),
      password: 'none'
    }
    socket.emit('set name', userObj);
  });
  $('#tag').on('keypress', function(e) {
    var name = $(this).text();
    if(name.length >= 12) {
      return false;
    }
    if(e.which == 13) {
      $(this).blur();
      return false;
    }
  });

  $('#lock').on('click', function() {
    if(locked) {
      var userObj = localStorage.getItem('userObj');
      socket.emit('unlock name', JSON.parse(userObj));
    } else {
      var name = $('#tag').text();
      socket.emit('lock name', name);
    }
  });

  socket.on('name success', function(name) {
    $('#tag').text(name);
    $('#tag').css('border-color', '#27ae60');
  });

  socket.on('name fail', function() {
    $('#tag').css('border-color', '#c0392b');
  });

  socket.on('name remove', function() {
    $('#tag').css('border-color', 'rgba(255, 255, 255, 0.5)');
  });

  socket.on('lock success', function(userObj) {
    localStorage.setItem('userObj', JSON.stringify(userObj));
    locked = true;
    $('#tag').text(userObj.name);
    $('#tag').css('border-color', '#27ae60');
    $('#tag').prop('contenteditable', 'false');
    $('#lock').removeClass('icon-lock-open').addClass('icon-lock');
  });

  socket.on('unlock success', function() {
    localStorage.removeItem('userObj');
    locked = false;
    $('#tag').prop('contenteditable', 'true');
    $('#lock').removeClass('icon-lock').addClass('icon-lock-open');
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
    $('title').text('! chatnon.');
  }
  else {
    $('title').text('chatnon.');
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
  var userObj = localStorage.getItem('userObj');
  if(userObj) {
    socket.emit('set name', JSON.parse(userObj));
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














