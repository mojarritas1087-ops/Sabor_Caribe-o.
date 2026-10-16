/* 3. Interfaz común: cabecera, pie, ventanas emergentes, buscador (Dónde · Fecha y hora · Comensales) y tarjetas */
'use strict';

const ICON_SEARCH='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
const ICON_PIN='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const ICON_CLOSE='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';
const ICON_BACK='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

/* ---------- cabecera y pie ---------- */
function renderHeader(){
  const u=Session.user(), chef=u&&u.rol==='chef';
  let right='';
  if(!u) right='<a href="#/login" class="on">Iniciar sesión</a>';
  else right=(chef?'<a href="#/mi-perfil">Mi perfil de chef</a>':'')+'<a href="#/reservas">Mis reservas</a>';
  const photo=u?(chef&&chefByEmail(u.email)?chefByEmail(u.email).foto:u.foto):null;
  const menu='<div style="position:relative"><button class="userbtn" data-act="menu" aria-haspopup="true" aria-expanded="false" aria-label="Menú de la cuenta">'+avatar(photo,30,u?u.nombre:'Sin sesión')+'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14261a" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>';
  $('#top').innerHTML='<a class="logo" href="#/"><img src="assets/logo-icono.svg" alt="" width="46" height="46"><span>Sabor Caribeño</span></a><nav class="nav" aria-label="Principal">'+right+menu+'</nav>';
}
const MI=(d)=>'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const MICON={
  user:MI('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18c1.5-2.5 3.2-3.5 5.5-3.5s4 1 5.5 3.5"/>'),
  cal:MI('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  chef:MI('<path d="M7 14a4 4 0 1 1 2-7.5 4 4 0 0 1 6 0A4 4 0 1 1 17 14v5H7z"/><path d="M7 17h10"/>'),
  add:MI('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6M19 3v5M16.5 5.5h5"/>'),
  help:MI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'),
  info:MI('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),
  out:MI('<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>')
};
const mi=(ic,t,attrs)=>'<'+(attrs.indexOf('href')>=0?'a':'button')+' '+attrs+'>'+MICON[ic]+'<span>'+t+'</span></'+(attrs.indexOf('href')>=0?'a':'button')+'>';
ACT.menu=(btn,e)=>{
  e.stopPropagation();
  const old=$('.menu'); if(old){old.remove();btn.setAttribute('aria-expanded','false');return;}
  const u=Session.user(); let h='<div class="menu" role="menu">';
  if(u){
    h+='<div class="who"><b>'+esc(u.nombre)+'</b><br>'+esc(u.email)+' · '+(u.rol==='chef'?'Chef':'Comensal')+'</div>';
    if(u.rol==='chef') h+=mi('chef','Mi perfil de chef','href="#/mi-perfil"');
    h+=mi('cal',u.rol==='chef'?'Solicitudes de reserva':'Mis reservas','href="#/reservas"');
  }else{
    h+=mi('user','Iniciar sesión','href="#/login"')+mi('add','Crear cuenta','href="#/registro"');
  }
  h+='<hr>'+mi('help','Centro de ayuda','data-act="faq"')+mi('info','¿Cómo funciona?','data-act="tutopen"');
  if(u) h+='<hr>'+mi('out','Cierra la sesión','data-act="salir"');
  h+='</div>';
  $('#top').insertAdjacentHTML('beforeend',h); btn.setAttribute('aria-expanded','true');
};
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.userbtn'))return;const m=$('.menu');if(m)m.remove();});
ACT.salir=()=>{Session.logout();sess.del('after');toast('Cerraste sesión.');go('/');};

const WA_ICON='<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.19 1.6 6.02L4 29l8.13-1.56a12.03 12.03 0 0 0 3.9.65C22.67 28.09 28 22.7 28 16.06 28 9.4 22.68 3 16.04 3zm0 22.04c-1.2 0-2.38-.3-3.42-.87l-.5-.27-4.83.93.96-4.7-.3-.52a9.97 9.97 0 0 1-1.48-5.28c0-5.5 4.5-9.97 10.03-9.97 5.5 0 9.97 4.3 9.97 9.8 0 5.54-4.46 10.88-9.97 10.88zm5.5-7.4c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.64-.93-2.25-.24-.58-.5-.5-.68-.5l-.58-.01c-.2 0-.52.08-.8.37-.27.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.1 3.2 5.1 4.5.72.3 1.28.5 1.7.63.72.22 1.37.2 1.88.12.58-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35z"/></svg>';
function renderFooter(){ $('#foot').innerHTML=''; }
ACT.faq=(el,e)=>{
  if(e&&e.preventDefault)e.preventDefault();
  openModal('<h2>Preguntas frecuentes</h2><div style="margin-top:16px;font-size:15px"><p><b>¿Cómo sé que el chef es de confianza?</b><br>Cada chef pasa por revisión de identidad y de su certificación culinaria antes de aparecer.</p><p><b>¿Cuándo se me cobra?</b><br>Al confirmar el pago. El dinero se libera al chef cuando termina el servicio.</p><p><b>¿Puedo cancelar?</b><br>Sí, desde «Mis reservas» mientras el chef no haya aceptado.</p><p><b>¿Qué incluye el precio?</b><br>El menú por persona, los ingredientes, el transporte del chef y la tarifa de servicio.</p></div>');
};
ACT.tutopen=(el,e)=>{e.preventDefault();Tutorial.open();};

/* ---------- ventanas emergentes ---------- */
function openModal(inner,opts){
  opts=opts||{};
  $('#ov').innerHTML='<div class="ov" data-act="ovclose"><div class="modal'+(opts.wide?' wide':'')+'" role="dialog" aria-modal="true">'+
    (opts.back?'<button class="bk" data-act="modalback" aria-label="Volver">'+ICON_BACK+'</button>':'')+
    '<button class="x" data-act="modalx" aria-label="Cerrar">'+ICON_CLOSE+'</button>'+(/^#\/(login|registro|registro-chef|registro-chef-datos)$/.test(location.hash)?'<img class="mlogo" src="assets/logo-icono.svg" alt="Sabor Caribeño" width="64" height="64">':'')+inner+'</div></div>';
  const m=$('#ov .modal');
  const f=m.querySelector('input,select,textarea,button.btn'); if(f) setTimeout(()=>f.focus&&f.focus(),30);
}
function closeModal(){$('#ov').innerHTML='';}
function _closeIt(){ if(/^#\/(login|registro|registro-chef)$/.test(location.hash)) go('/'); else closeModal(); }
ACT.ovclose=(el,e)=>{ if(e.target===el) _closeIt(); };
ACT.modalx=()=>_closeIt();
ACT.modalback=()=>{ const h=location.hash; if(h==='#/registro-chef') go('/registro'); else if(h==='#/registro') go('/login'); else back('/'); };
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if($('#ov .ov')) _closeIt(); closePop(); } });

/* ---------- buscador ---------- */
let _pop=null, _calMonth=0;
function searchBar(compact){
  return '<div class="sw" id="sw"><div class="sb'+(compact?' compact':'')+'">'+
    '<button class="f" data-f="fecha" aria-haspopup="dialog"><b>Fecha y hora</b><span></span></button><i class="sep"></i>'+
    '<button class="f" data-f="comen" aria-haspopup="dialog"><b>Comensales</b><span></span></button>'+
    '<button class="go" data-act="buscar" aria-label="Buscar chefs">'+ICON_SEARCH+'</button></div><div id="popslot"></div></div>';
}
function bindSearch(){
  if(!Search.get().city) Search.set({city:'santa-marta'});
  _pop=null; updateBar();
  $$('#sw .f').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();togglePop(b.dataset.f);}));
}
function updateBar(){
  const s=Search.get(), sw=$('#sw'); if(!sw) return;
  const set=(k,txt,on)=>{const sp=$('[data-f="'+k+'"] span',sw);sp.textContent=txt;sp.className=on?'set':'';};
  set('fecha',s.date?fmtShort(s.date)+(s.time?' · '+fmtHour(s.time):''):'Agrega fecha',!!s.date);
  set('comen',s.guests?s.guests+(s.guests>1?' personas':' persona'):'¿Cuántos comen?',!!s.guests);
  $$('#sw .f').forEach(b=>b.classList.toggle('open',b.dataset.f===_pop));
}
function closePop(){_pop=null;const sl=$('#popslot');if(sl)sl.innerHTML='';updateBar();}
function togglePop(name){ if(_pop===name) closePop(); else openPopFor(name); }
function openPopFor(name){
  _pop=name; const sw=$('#sw'); if(!sw) return;
  const btn=$('[data-f="'+name+'"]',sw), swW=sw.offsetWidth;
  const width=name==='fecha'?Math.min(860,swW):name==='donde'?Math.min(540,swW):Math.min(400,swW);
  let left=name==='fecha'?Math.max(0,(swW-width)/2):name==='donde'?Math.max(0,btn.offsetLeft-4):Math.max(0,Math.min(btn.offsetLeft,swW-width));
  const slot=$('#popslot'); slot.innerHTML='<div class="pop" role="dialog" aria-label="'+name+'" style="left:'+left+'px;width:'+width+'px"></div>';
  fillPop(); updateBar();
}
function fillPop(){
  const p=$('#popslot .pop'); if(!p) return; const s=Search.get();
  if(_pop==='donde'){
    let h='<h4>Destinos sugeridos</h4><button class="dest" data-act="near"><i style="background:#456D1B22;color:#456D1B"><s></s></i><span><b>Cerca de ti</b><small>Usar mi ubicación actual</small></span></button>';
    CITIES.forEach(c=>{h+='<button class="dest" data-act="pickcity" data-id="'+c.id+'"><i style="background:'+c.color+'22;color:'+c.color+'"><s></s></i><span><b>'+esc(c.name)+'</b><small>'+esc(c.sub)+'</small></span></button>';});
    p.innerHTML=h;
  }else if(_pop==='fecha'){
    const now=new Date(), months=[0,1].map(k=>new Date(now.getFullYear(),now.getMonth()+_calMonth+k,1));
    let h='<div class="cal">';
    months.forEach((m,idx)=>{
      const off=(m.getDay()+6)%7, n=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
      h+='<div><div class="mh">'+(idx===0?'<button data-act="calprev" aria-label="Mes anterior" '+(_calMonth<=0?'disabled style="opacity:.3"':'')+'>‹</button>':'<span style="width:34px"></span>')+'<span>'+MESES_L[m.getMonth()]+' '+m.getFullYear()+'</span>'+(idx===1?'<button data-act="calnext" aria-label="Mes siguiente">›</button>':'<span style="width:34px"></span>')+'</div><div class="g">';
      ['L','Ma','Mi','J','V','S','D'].forEach(d=>h+='<span class="dn">'+d+'</span>');
      for(let i=0;i<off;i++) h+='<span></span>';
      for(let d=1;d<=n;d++){const iso=isoOf(new Date(m.getFullYear(),m.getMonth(),d));h+='<button data-act="pickdate" data-iso="'+iso+'" class="'+(s.date===iso?'sel':'')+'" '+(iso<todayISO()?'disabled':'')+'>'+d+'</button>';}
      h+='</div></div>';
    });
    h+='</div><div style="border-top:1px solid var(--line);margin-top:18px;padding-top:16px"><b style="display:block;margin-bottom:10px">Hora de la cena</b><div class="hours">';
    HOURS.forEach(t=>{h+='<button class="chip'+(s.time===t?' on':'')+'" data-act="pickhour" data-h="'+t+'">'+fmtHour(t)+'</button>';});
    h+='</div><p class="hint" style="margin:10px 0 0">Solo verás los chefs que tengan libre esa fecha y hora.</p></div>';
    p.innerHTML=h;
  }else if(_pop==='comen'){
    const g=s.guests||2;
    p.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><div><b style="font-size:17px">Comensales</b><div class="muted" style="font-size:14px">Máximo 12 personas</div></div><div class="stepper"><button data-act="gminus" aria-label="Quitar uno" '+(g<=1?'disabled':'')+'>−</button><b style="width:22px;text-align:center;font-size:18px">'+g+'</b><button data-act="gplus" aria-label="Agregar uno" '+(g>=12?'disabled':'')+'>+</button></div></div>'+
      '<div style="border-top:1px solid var(--line);margin:18px 0;padding-top:16px;display:flex;align-items:center;justify-content:space-between;gap:16px"><div><b style="font-size:17px">Alergias o restricciones</b><div class="muted" style="font-size:14px">Se lo informamos al chef antes de que acepte</div></div><button class="switch'+(s.allergies?' on':'')+'" data-act="allergy" role="switch" aria-checked="'+(!!s.allergies)+'" aria-label="Alergias o restricciones"></button></div>'+
      (s.allergies?'<label class="field"><span>¿Cuáles?</span><input id="notes" maxlength="160" value="'+esc(s.notes)+'" placeholder="Ej. sin mariscos, alergia al maní"></label>':'')+
      '<div class="muted" style="font-size:14px;margin-bottom:12px">El precio se calcula por persona.</div><button class="btn sm" data-act="gdone">Listo</button>';
    const n=$('#notes',p); if(n) n.addEventListener('input',()=>Search.set({notes:n.value}));
  }
}
document.addEventListener('click',e=>{ if(_pop&&!e.composedPath().some(n=>n.id==='sw')) closePop(); });

ACT.pickcity=el=>{Search.set({city:el.dataset.id});updateBar();openPopFor('fecha');};
ACT.near=()=>{
  Geo.setOn(true); toast('Buscando tu ubicación…');
  const un=Geo.subscribe(()=>{
    if(Geo.pos){
      let best=null,bd=1e9; CITIES.forEach(c=>{const d=haversine(Geo.pos,{lat:c.lat,lon:c.lon});if(d<bd){bd=d;best=c;}});
      if(best&&bd<60){Search.set({city:best.id});toast('Estás cerca de '+best.name.split(',')[0]+'.');}
      else{Search.set({city:'santa-marta'});toast('Aún no hay chefs cerca de ti; te mostramos Santa Marta.');}
      un(); updateBar(); if(_pop==='donde') openPopFor('fecha');
    }else if(Geo.denied){un();}
  });
};
ACT.calprev=()=>{if(_calMonth>0){_calMonth--;fillPop();}};
ACT.calnext=()=>{_calMonth++;fillPop();};
ACT.pickdate=el=>{Search.set({date:el.dataset.iso});updateBar();fillPop();};
ACT.pickhour=el=>{Search.set({time:el.dataset.h});updateBar();if(!Search.get().date){fillPop();toast('Ahora elige el día.');return;}openPopFor('comen');};
ACT.gplus=()=>{const s=Search.get(),g=Math.min(12,(s.guests||2)+1);Search.set({guests:g});updateBar();fillPop();};
ACT.gminus=()=>{const s=Search.get(),g=Math.max(1,(s.guests||2)-1);Search.set({guests:g});updateBar();fillPop();};
ACT.allergy=()=>{const s=Search.get();Search.set({allergies:!s.allergies,notes:s.allergies?'':s.notes,guests:s.guests||2});updateBar();fillPop();};
ACT.gdone=()=>{const s=Search.get();if(!s.guests)Search.set({guests:2});closePop();};
ACT.buscar=()=>{
  const s=Search.get();
  if(!s.city){Search.set({city:'santa-marta'});toast('Elegimos Santa Marta, donde hay más chefs.');}
  if(!s.guests) Search.set({guests:2});
  closePop(); go('/resultados');
};

/* ---------- tarjetas ---------- */
function chefCard(c,ref,tag){
  const eta=etaMin(c,ref);
  return '<a class="card" href="#/chef/'+c.id+'"><div class="ph" style="background-image:'+bgOf(c.fotos&&c.fotos[0],c.id.length+c.id.charCodeAt(c.id.length-1))+'">'+((c.fotos&&c.fotos[0])?'':'<div class="ring"></div>')+(tag?'<span class="tag">'+esc(tag)+'</span>':'')+'</div>'+
    '<div class="nm"><span>'+esc(c.dishes.slice(0,2).join(', '))+'</span><span style="font-weight:500;font-size:14px;white-space:nowrap">★ '+ratingTxt(c)+'</span></div>'+
    '<div class="sub">Chef '+esc(c.name)+'</div><div class="sub">'+esc(c.zone)+', '+esc(cityById(c.city)?cityById(c.city).name.split(',')[0]:c.city)+'</div>'+
    etaChip(eta)+
    '<div class="pr"><b>'+money(c.price)+'</b> <span class="muted">por persona</span> <span style="color:var(--jungle);font-size:13px;font-weight:700">✓ Verificado</span></div></a>';
}

/* ---------- exigir sesión ---------- */
function requireLogin(returnTo,rol){
  const u=Session.user();
  if(u&&(!rol||u.rol===rol)) return true;
  sess.set('after',returnTo||location.hash.slice(1)||'/');
  toast(u?'Esta sección es para cuentas de '+(rol==='chef'?'chef':'comprador')+'.':'Inicia sesión para continuar.');
  go('/login'); return false;
}
