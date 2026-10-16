/* 1. Base: utilidades, almacenamiento, sesión, precios y enrutador */
'use strict';
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---- almacenamiento: localStorage (cuentas, chefs, reservas) y sessionStorage (búsqueda, reserva en curso) ---- */
const store={
  get(k,d){try{const v=localStorage.getItem('sc_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('sc_'+k,JSON.stringify(v));return true;}catch(e){toast('No hay espacio para guardar. Prueba con fotos más pequeñas.');return false;}}
};
const sess={
  get(k,d){try{const v=sessionStorage.getItem('sc_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{sessionStorage.setItem('sc_'+k,JSON.stringify(v));}catch(e){}},
  del(k){try{sessionStorage.removeItem('sc_'+k);}catch(e){}}
};

/* ---- avisos ---- */
let _toastT;
function toast(msg){
  const t=$('#toast'); if(!t) return;
  t.textContent=msg; t.hidden=false; clearTimeout(_toastT);
  _toastT=setTimeout(()=>{t.hidden=true;},3800);
}

/* ---- fechas y horas ---- */
const MESES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESES_L=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_L=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const todayISO=()=>isoOf(new Date());
function fmtShort(iso){if(!iso)return '';const d=parseISO(iso);return d.getDate()+' '+MESES[d.getMonth()];}
function fmtLong(iso){if(!iso)return '';const d=parseISO(iso);return d.getDate()+' '+MESES[d.getMonth()]+' '+d.getFullYear();}
function fmtHour(h){if(!h)return '';const [H,M]=h.split(':').map(Number);return ((H%12)||12)+':'+pad(M)+' '+(H<12?'AM':'PM');}
const HOURS=['12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
const mins=h=>{const [H,M]=h.split(':').map(Number);return H*60+M;};

/* ---- precios: los chefs cobran en USD por persona; se muestra en la moneda elegida ---- */
const RATES={USD:1,EUR:0.92,COP:4000};
const PRICE_LOW=35, PRICE_HIGH=45;
function money(usd,cur){
  cur=cur||'USD'; const v=usd*RATES[cur];
  if(cur==='COP') return '$'+Math.round(v).toLocaleString('es-CO')+' COP';
  if(cur==='EUR') return v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
  return 'US$'+(Number.isInteger(usd)?usd:usd.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}));
}
/* menú + ingredientes y transporte (15,8 %) + tarifa de servicio (8,55 %) − descuento */
function breakdown(price,guests,descPct){
  const r2=n=>Math.round(n*100)/100;
  const menu=r2((+price||0)*(+guests||0)), ingr=r2(menu*0.158), svc=r2(menu*0.0855);
  const desc=r2(menu*((descPct||0)/100));
  return {menu,ingr,svc,desc,total:r2(menu+ingr+svc-desc)};
}

/* ---- imágenes ---- */
function avatarSVG(size,label){
  return '<svg class="avatar" width="'+size+'" height="'+size+'" viewBox="0 0 100 100" role="img" aria-label="'+esc(label||'Sin foto de perfil')+'"><rect width="100" height="100" fill="#d4d4d4"/><circle cx="50" cy="38" r="17" fill="#fff"/><path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="#fff"/></svg>';
}
function avatar(src,size,label){
  return src?'<img class="avatar" src="'+src+'" width="'+size+'" height="'+size+'" alt="'+esc(label||'Foto de perfil')+'">':avatarSVG(size,label);
}
const GRADS=['linear-gradient(135deg,#ece8dc,#d6d1c0)','linear-gradient(135deg,#e6e3d8,#cdc8b6)','linear-gradient(135deg,#efebe0,#d9d4c4)','linear-gradient(135deg,#e2dfd3,#c9c4b2)','linear-gradient(135deg,#eae6da,#d3cebd)'];
const bgOf=(img,i)=>img?'url('+img+')':GRADS[(i||0)%GRADS.length];
function readImage(file,max){
  max=max||720;
  return new Promise((res,rej)=>{
    if(!file||!/^image\//.test(file.type)) return rej(new Error('Elige una imagen JPG o PNG.'));
    const fr=new FileReader();
    fr.onerror=()=>rej(new Error('No se pudo leer la imagen.'));
    fr.onload=()=>{
      const im=new Image();
      im.onerror=()=>rej(new Error('La imagen no es válida.'));
      im.onload=()=>{
        const k=Math.min(1,max/Math.max(im.width,im.height)), c=document.createElement('canvas');
        c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        res(c.toDataURL('image/jpeg',0.8));
      };
      im.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ---- seguridad básica: la contraseña nunca se guarda en claro ---- */
async function sha256(txt){
  try{
    const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('sabor-caribeno::'+txt));
    return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }catch(e){let h=5381;for(const ch of 'sabor::'+txt)h=((h<<5)+h+ch.charCodeAt(0))|0;return 'x'+h;}
}
const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e||'');
const validPass=p=>(p||'').length>=8&&/\d/.test(p)&&/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(p);

/* ---- cuentas y sesión ---- */
const Users={
  all(){return store.get('users',[]);},
  save(a){store.set('users',a);},
  byEmail(e){e=(e||'').trim().toLowerCase();return Users.all().find(u=>u.email===e)||null;},
  update(email,patch){const a=Users.all();const i=a.findIndex(u=>u.email===email);if(i<0)return;Object.assign(a[i],patch);Users.save(a);}
};
const Session={
  email(){return store.get('session',null);},
  user(){const e=Session.email();return e?Users.byEmail(e):null;},
  login(email){store.set('session',email);},
  logout(){try{localStorage.removeItem('sc_session');}catch(e){}}
};
const isChef=()=>{const u=Session.user();return !!(u&&u.rol==='chef');};

/* ---- reservas ---- */
const Reservas={
  all(){return store.get('reservas',[]);},
  save(a){store.set('reservas',a);},
  add(r){const a=Reservas.all();a.push(r);Reservas.save(a);},
  byId(id){return Reservas.all().find(r=>String(r.id)===String(id));},
  setEstado(id,estado){
    const a=Reservas.all();const r=a.find(x=>String(x.id)===String(id));if(!r)return;
    r.estado=estado;Reservas.save(a);
    enviarASheets({tipo:'estado',id:r.id,estado,correo:r.buyerEmail,chef:r.chefName||r.chef||'',fecha:r.fecha,hora:r.hora});
  }
};

/* ---- enrutador por hash ---- */
const ROUTES=[]; let _cleanup=[];
function route(pattern,fn){
  const keys=[]; const re=new RegExp('^'+pattern.replace(/:(\w+)/g,(m,k)=>{keys.push(k);return '([^/]+)';})+'$');
  ROUTES.push({re,keys,fn});
}
function onLeave(fn){_cleanup.push(fn);}
function go(path){ if(location.hash==='#'+path) render(); else location.hash=path; }
function back(fallback){ if(history.length>1&&document.referrer!==''||history.length>2) history.back(); else go(fallback||'/'); }
function render(){
  _cleanup.forEach(f=>{try{f();}catch(e){}}); _cleanup=[];
  const ov=$('#ov'); if(ov) ov.innerHTML='';
  const path=decodeURIComponent((location.hash.slice(1)||'/').split('?')[0]);
  renderHeader();
  for(const r of ROUTES){
    const m=path.match(r.re);
    if(m){const p={};r.keys.forEach((k,i)=>p[k]=m[i+1]);r.fn(p);window.scrollTo(0,0);renderFooter();return;}
  }
  go('/');
}
window.addEventListener('hashchange',render);

/* ---- delegación de clics: data-act="nombre" ---- */
const ACT={};
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  if(t&&ACT[t.dataset.act]){ACT[t.dataset.act](t,e);}
});
