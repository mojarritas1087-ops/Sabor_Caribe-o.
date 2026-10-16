'use strict';
Tutorial.init();
if(Geo.enabled()) Geo.request();
else if(store.get('geoOn',null)===null) Geo.setOn(true); /* primera visita: pide permiso para ubicarte en el mapa */
render();
