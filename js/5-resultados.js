/* 5. Resultados: lista larga con scroll + mapa fijo, filtros y tiempo de llegada */
'use strict';

let _map=null, _pins={}, _meMarker=null, _view='list';

function applyFilters(){
  const s=Search.get(), f=s.filters||{}, ref=refPoint(s.city||'santa-marta');
  let list=allChefs().filter(c=>c.city===(s.city||'santa-marta'));
  if(f.avail!==false&&(s.date||s.time)) list=list.filter(c=>chefAvailable(c,s.date,s.time));
  if(f.price==='low') list=list.filter(c=>c.price<PRICE_LOW);
  if(f.price==='mid') list=list.filter(c=>c.price>=PRICE_LOW&&c.price<=PRICE_HIGH);
  if(f.price==='high') list=list.filter(c=>c.price>PRICE_HIGH);
  if(f.rating) list=list.filter(c=>c.avg&&c.avg>=f.rating);
  if(f.dish) list=list.filter(c=>c.dishes.join(' ').toLowerCase().indexOf(f.dish.toLowerCase())>=0);
  list.forEach(c=>{c._eta=etaMin(c,ref);c._key=etaKey(c,ref);});
  if(f.sort==='rating') list.sort((a,b)=>(b.avg||0)-(a.avg||0));
  else if(f.sort==='price') list.sort((a,b)=>a.price-b.price);
  else list.sort((a,b)=>a._key-b._key);
  return {list,ref,s,f};
}

function renderResultados(){
  const s=Search.get(); if(!s.city){Search.set({city:'santa-marta'});}
  $('#app').innerHTML=
    '<div class="rtop"><a class="logo" href="#/" style="font-size:0;display:none">.</a>'+'<div style="flex:1;min-width:280px;max-width:760px">'+searchBar(true)+'</div></div>'+
    '<div class="filters" id="filters"></div>'+
    '<div class="tgl"><button class="chip on" data-act="viewlist">Lista</button><button class="chip" data-act="viewmap">Mapa</button></div>'+
    '<div class="res listmode" id="res"><div class="list" id="list"></div><div class="mapcol"><div id="map" aria-label="Mapa de chefs"></div></div></div>';
  bindSearch(); drawFilters(); drawList(); drawMap();
  const un=Geo.subscribe(()=>{ if(!$('#list'))return; drawList(); drawFilters(); moveMe(); }); onLeave(un);
  onLeave(()=>{ if(_map&&_map.remove){try{_map.remove();}catch(e){}} _map=null;_pins={};_meMarker=null;delete _meMk.m; });
  if(Geo.enabled()&&!Geo.pos&&!Geo.denied) Geo.request();
}
const _sbUpdate=updateBar;

function drawFilters(){
  const {s,f}=applyFilters(), el=$('#filters'); if(!el) return;
  el.innerHTML='<button class="chip" data-act="openfilters">⚙ Filtros</button>'+
    ((s.date||s.time)?'<button class="chip'+(f.avail!==false?' on':'')+'" data-act="fav">Disponible'+(s.date?' el '+fmtShort(s.date):'')+(s.time?' · '+fmtHour(s.time):'')+'</button>':'')+
    '<button class="chip'+(f.price==='low'?' on':'')+'" data-act="fprice">Hasta '+money(PRICE_LOW)+'</button>'+
    '<button class="chip'+(f.rating>=4.5?' on':'')+'" data-act="frating">★ 4,5 o más</button>'+
    '<button class="chip'+(f.dish?' on':'')+'" data-act="openfilters">Plato'+(f.dish?': '+esc(f.dish):'')+'</button>'+
    '<label class="chip" style="margin-left:auto">Ordenar&nbsp;<select id="sortsel" style="border:none;background:none;font:inherit;font-weight:700"><option value="eta"'+(f.sort==='eta'?' selected':'')+'>Más cercano</option><option value="rating"'+(f.sort==='rating'?' selected':'')+'>Mejor calificado</option><option value="price"'+(f.sort==='price'?' selected':'')+'>Menor precio</option></select></label>';
  $('#sortsel').addEventListener('change',e=>{setFilter({sort:e.target.value});});
}
function setFilter(p){const f=Object.assign({},Search.get().filters,p);Search.set({filters:f});drawFilters();drawList();drawMap(true);}
ACT.fav=()=>{const f=Search.get().filters;setFilter({avail:f.avail===false});};
ACT.fprice=()=>{const f=Search.get().filters;setFilter({price:f.price==='low'?'all':'low'});};
ACT.frating=()=>{const f=Search.get().filters;setFilter({rating:f.rating>=4.5?0:4.5});};
ACT.openfilters=()=>{
  const f=Search.get().filters;
  openModal('<h2>Filtros</h2><div style="margin-top:18px"><label class="field"><span>Precio por persona</span><select id="fp"><option value="all">Todos los precios</option><option value="low"'+(f.price==='low'?' selected':'')+'>Hasta '+money(PRICE_LOW)+'</option><option value="mid"'+(f.price==='mid'?' selected':'')+'>'+money(PRICE_LOW)+' – '+money(PRICE_HIGH)+'</option><option value="high"'+(f.price==='high'?' selected':'')+'>Más de '+money(PRICE_HIGH)+'</option></select></label>'+
    '<label class="field"><span>Calificación</span><select id="fr"><option value="0">Cualquiera</option><option value="4.5"'+(f.rating>=4.5?' selected':'')+'>★ 4,5 o más</option><option value="4.8"'+(f.rating>=4.8?' selected':'')+'>★ 4,8 o más</option></select></label>'+
    '<label class="field"><span>Plato (ej. pescado, arroz, dulce)</span><input id="fd" value="'+esc(f.dish||'')+'" maxlength="30"></label>'+
    '<div class="row"><button class="ghostbtn" data-act="clearfilters">Borrar filtros</button><button class="btn" data-act="applyfilters">Mostrar chefs</button></div></div>');
};
ACT.applyfilters=()=>{const f={price:$('#fp').value,rating:+$('#fr').value,dish:$('#fd').value.trim()};closeModal();setFilter(f);};
ACT.clearfilters=()=>{closeModal();setFilter({price:'all',rating:0,dish:'',avail:true});};

function drawList(){
  const {list,ref,s}=applyFilters(), el=$('#list'); if(!el) return;
  const city=cityById(s.city||'santa-marta');
  let h='<h1 style="font-size:28px;margin-bottom:4px">Mejores opciones'+(ref.real?' cerca de ti':' en '+esc(city.name.split(',')[0]))+'</h1>'+
    '<div class="muted" style="margin-bottom:14px;font-size:15px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+ICON_PIN+(ref.real?'Tiempo de llegada estimado desde tu ubicación actual.':'Activa tu ubicación para ver cuánto tarda cada chef en llegar.')+(Geo.enabled()?'':' <button class="linkbtn" data-act="geoon">Usar mi ubicación</button>')+'</div>';
  if(!list.length) h+='<div class="empty"><b>No hay chefs con esos filtros.</b><p>Prueba otra fecha u hora, o borra los filtros.</p><button class="btn sm" data-act="clearfilters">Borrar filtros</button></div>';
  list.forEach((c,i)=>{
    h+='<a class="rc" href="#/chef/'+c.id+'" data-id="'+c.id+'"><div class="im" style="background-image:'+bgOf(c.fotos&&c.fotos[0],i)+'"></div><div style="min-width:0;flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><h3>'+esc(c.dishes.slice(0,2).join(', '))+'</h3><span style="white-space:nowrap">★ '+ratingTxt(c)+'</span></div><div class="meta">Chef '+esc(c.name)+' · '+esc(c.zone)+', '+esc(city.name.split(',')[0])+'</div>'+(c._eta!=null?'<span class="eta">'+ICON_PIN+'Llega en ~'+c._eta+' min</span>':'')+'<div style="margin-top:4px"><b>'+money(c.price)+'</b> <span class="muted">por persona</span> <span style="color:var(--jungle);font-size:13px;font-weight:700">✓ Verificado</span></div></div></a>';
  });
  el.innerHTML=h;
  $$('.rc',el).forEach(a=>{
    a.addEventListener('mouseenter',()=>hlPin(a.dataset.id,true));
    a.addEventListener('mouseleave',()=>hlPin(a.dataset.id,false));
  });
}
ACT.geoon=()=>{Geo.setOn(true);toast('Buscando tu ubicación…');};
function hlPin(id,on){
  const p=_pins[id]; if(!p) return;
  const e=p.getElement?p.getElement().querySelector('.pin'):p;
  if(e) e.classList.toggle('on',on);
  $$('.rc').forEach(a=>a.classList.toggle('hl',on&&a.dataset.id===id));
}

/* ---- mapa: Leaflet + OpenStreetMap; si no carga, un mapa esquemático con las mismas posiciones ---- */
function drawMap(refit){
  const {list,ref}=applyFilters(), el=$('#map'); if(!el) return;
  const pts=list.map(c=>[c.lat,c.lon]); if(ref.real) pts.push([ref.p.lat,ref.p.lon]);
  if(window.L&&L.map){
    if(!_map){
      _map=L.map(el,{scrollWheelZoom:true,minZoom:11,maxZoom:16,maxBounds:SM_BOUNDS,maxBoundsViscosity:.9});
      addTiles(_map); locateCtl(_map);
    }
    Object.values(_pins).forEach(m=>{try{_map.removeLayer(m);}catch(e){}}); _pins={};
    list.forEach(c=>{
      const m=L.marker([c.lat,c.lon],{icon:L.divIcon({className:'',html:'<div class="pin" style="position:absolute">'+money(c.price)+'</div>',iconSize:[0,0]}),title:c.name,keyboard:true}).addTo(_map);
      m.on('click',()=>chefQuick(c.id)); _pins[c.id]=m;
    });
    moveMe();
    try{ if(pts.length) _map.fitBounds(L.latLngBounds(pts),{padding:[40,40],maxZoom:15}); else _map.setView([ref.city.lat,ref.city.lon],12); }catch(e){}
    setTimeout(()=>{try{_map.invalidateSize();}catch(e){}},200);
  }else{
    drawFallbackMap(el,list,ref,pts);
  }
}
let _meMk={};
function moveMe(){
  if(!window.L){ const el=$('#map .me'); if(el&&!Geo.pos) el.remove(); return; }
  [['m',_map],['h',_hmap]].forEach(([k,mp])=>{
    if(!mp) return; const mk=_meMk[k];
    if(!Geo.pos){ if(mk){try{mp.removeLayer(mk.dot);mp.removeLayer(mk.ring);}catch(e){} delete _meMk[k];} return; }
    const ll=[Geo.pos.lat,Geo.pos.lon];
    if(mk&&mp.hasLayer(mk.dot)){ mk.dot.setLatLng(ll); mk.ring.setLatLng(ll); mk.ring.setRadius(Math.min(Geo.pos.acc||40,400)); return; }
    _meMk[k]={ring:L.circle(ll,{radius:Math.min(Geo.pos.acc||40,400),color:'#1a73e8',weight:1,fillOpacity:.12,interactive:false}).addTo(mp),
      dot:L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="me live"></div>',iconSize:[0,0]}),interactive:false,zIndexOffset:1000}).addTo(mp)};
  });
}
function locateCtl(mp){
  const C=L.Control.extend({options:{position:'topleft'},onAdd(){
    const d=L.DomUtil.create('div','leaflet-bar locbtn'); d.innerHTML='<a href="#" role="button" title="Mi ubicación" aria-label="Mi ubicación">◎</a>';
    L.DomEvent.disableClickPropagation(d);
    d.firstChild.onclick=e=>{e.preventDefault(); if(!Geo.enabled()){Geo.setOn(true);toast('Buscando tu ubicación…');}
      else if(Geo.pos) mp.flyTo([Geo.pos.lat,Geo.pos.lon],Math.max(mp.getZoom(),15)); else toast('Aún buscando tu ubicación…');};
    return d;}});
  new C().addTo(mp);
}
function drawFallbackMap(el,list,ref,pts){
  const all=pts.length?pts:[[ref.city.lat,ref.city.lon]];
  let minLa=Math.min(...all.map(p=>p[0])),maxLa=Math.max(...all.map(p=>p[0])),minLo=Math.min(...all.map(p=>p[1])),maxLo=Math.max(...all.map(p=>p[1]));
  const padLa=Math.max((maxLa-minLa)*.15,.004),padLo=Math.max((maxLo-minLo)*.15,.004);
  minLa-=padLa;maxLa+=padLa;minLo-=padLo;maxLo+=padLo;
  const pos=(la,lo)=>'left:'+((lo-minLo)/(maxLo-minLo)*100).toFixed(2)+'%;top:'+((maxLa-la)/(maxLa-minLa)*100).toFixed(2)+'%';
  el.innerHTML='<svg width="100%" height="100%" aria-hidden="true" style="position:absolute;inset:0"><defs><pattern id="gr" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#c9dca8" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="#e4efd3"/><rect width="100%" height="100%" fill="url(#gr)"/></svg>'+
    list.map(c=>'<button class="pin" data-act="quick2" data-id="'+c.id+'" data-pin="'+c.id+'" style="'+pos(c.lat,c.lon)+'" aria-label="'+esc(c.name)+', '+money(c.price)+'">'+money(c.price)+'</button>').join('')+
    (Geo.pos?'<div class="me" style="'+pos(Geo.pos.lat,Geo.pos.lon)+'"></div>':'')+
    '<div class="mapnote">Vista esquemática de las zonas de los chefs (el mapa detallado no se pudo cargar). Nunca mostramos direcciones exactas.</div>';
  _pins={}; $$('[data-pin]',el).forEach(b=>{_pins[b.dataset.pin]=b;});
}
ACT.quick2=el=>chefQuick(el.dataset.id);
ACT.viewlist=()=>{const r=$('#res');r.classList.add('listmode');r.classList.remove('mapmode');$$('.tgl .chip').forEach((b,i)=>b.classList.toggle('on',i===0));};
ACT.viewmap=()=>{const r=$('#res');r.classList.add('mapmode');r.classList.remove('listmode');$$('.tgl .chip').forEach((b,i)=>b.classList.toggle('on',i===1));if(_map)setTimeout(()=>{try{_map.invalidateSize();drawMap();}catch(e){}},50);};

/* ---- ventana rápida del chef (al tocar un punto del mapa) ---- */
function chefQuick(id){
  const c=chefById(id); if(!c) return; const ref=refPoint(c.city);
  openModal('<div style="display:flex;align-items:center;gap:22px;margin:6px 0 16px"><div style="border:4px solid #fff;border-radius:50%;box-shadow:0 4px 14px rgba(13,59,30,.25);position:relative">'+avatar(c.foto,100,c.name)+'<b style="position:absolute;right:0;bottom:2px;width:30px;height:30px;border-radius:50%;background:var(--jungle);border:3px solid #fff;color:#fff;text-align:center;line-height:24px;font-size:14px">✓</b></div><div><h2 style="text-align:left;margin:0 0 4px;font-size:28px">'+esc(c.name)+'</h2><div class="muted">Chef caribeña · '+esc(c.zone)+', '+esc(cityById(c.city).name.split(',')[0])+'</div><div>★ '+ratingTxt(c)+' · '+(c.allReviews||[]).length+' reseñas</div></div></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><span class="badge">✓ Identidad verificada</span><span class="badge">✓ Certificación culinaria</span><span class="badge">✓ Pago seguro</span></div>'+
    (etaMin(c,ref)!=null?'<div class="eta" style="display:flex;border-radius:14px;padding:12px 16px;margin-bottom:14px;font-size:16px">'+ICON_PIN+' Llega a tu ubicación en ~'+etaMin(c,ref)+' min</div>':'<div class="eta" style="display:flex;border-radius:14px;padding:12px 16px;margin-bottom:14px;font-size:15px;font-weight:600">'+ICON_PIN+' <span>Activa tu ubicación para ver el tiempo de llegada. <button class="linkbtn" data-act="geoon">Usar mi ubicación</button></span></div>')+
    '<div class="kv"><span>Platos</span><span style="text-align:right">'+esc(c.dishes.join(', '))+'</span></div><div class="kv"><span>Años de experiencia</span><span>'+esc(c.years)+'</span></div><div class="kv"><span>Precio</span><span><b>'+money(c.price)+'</b> por persona</span></div>'+
    '<p class="muted" style="font-size:15px;line-height:1.55;margin:14px 0">'+esc((c.bio||'').slice(0,160))+'</p>'+
    '<div class="row"><a class="btn" href="#/chef/'+c.id+'">Reservar con '+esc(c.name.split(' ')[0])+'</a><a class="ghostbtn" href="#/chef/'+c.id+'">Ver perfil completo</a></div>'+
    '<div style="text-align:center;margin-top:14px"><a href="https://wa.me/'+esc(c.wa)+'" target="_blank" rel="noopener" style="font-weight:700">Contactar por WhatsApp</a></div>',{wide:true});
}
route('/resultados',renderResultados);

/* ---- mapa de Santa Marta en el inicio ---- */
const SM_BOUNDS=[[11.05,-74.35],[11.35,-74.05]]; /* Santa Marta y alrededores */
function addTiles(m){
  /* Mapa de calles sin llave de API: Esri World Street Map; si falla, OpenStreetMap */
  const esri=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,maxNativeZoom:16,attribution:'Tiles &copy; Esri'});
  const osm=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'});
  let fails=0, swapped=false;
  esri.on('tileerror',()=>{ if(++fails>=3&&!swapped){ swapped=true; try{m.removeLayer(esri); osm.addTo(m);}catch(e){} } });
  esri.addTo(m);
}
let _hmap=null;
function drawHomeMap(){
  const el=$('#homemap'); if(!el) return;
  const city=cityById('santa-marta'), list=allChefs().filter(c=>c.city==='santa-marta');
  if(window.L&&L.map){
    try{
      _hmap=L.map(el,{scrollWheelZoom:false,minZoom:11,maxZoom:16,maxBounds:SM_BOUNDS,maxBoundsViscosity:.9}).setView([city.lat,city.lon],13); addTiles(_hmap); locateCtl(_hmap); moveMe();
      list.forEach(c=>{
        L.marker([c.lat,c.lon],{icon:L.divIcon({className:'',html:'<div class="pin" style="position:absolute">'+money(c.price)+'</div>',iconSize:[0,0]}),title:c.name,keyboard:true}).addTo(_hmap).on('click',()=>chefQuick(c.id));
      });
      const pts=list.map(c=>[c.lat,c.lon]); if(pts.length) _hmap.fitBounds(L.latLngBounds(pts),{padding:[40,40],maxZoom:14});
      setTimeout(()=>{try{_hmap.invalidateSize();}catch(e){}},300);
      onLeave(()=>{try{_hmap.remove();}catch(e){} _hmap=null; delete _meMk.h;});
      return;
    }catch(e){}
  }
  drawFallbackMap(el,list,{city:city},list.map(c=>[c.lat,c.lon]));
}
