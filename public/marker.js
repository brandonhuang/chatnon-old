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