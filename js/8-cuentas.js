/* 8. Cuentas: ingreso, registro de comprador y registro de chef en 2 pasos */
'use strict';

const CODES=[['+57','Colombia'],['+1','EE. UU.'],['+34','España'],['+52','México'],['+507','Panamá'],['+54','Argentina'],['+56','Chile'],['+51','Perú']];
const codeOpts=(sel)=>CODES.map(c=>'<option value="'+c[0]+'"'+(c[0]===(sel||'+57')?' selected':'')+'>'+c[0]+' '+c[1]+'</option>').join('');

/* ---- código de verificación por correo ---- */
function sendCode(email){
  const code=String(Math.floor(100000+Math.random()*900000));
  sess.set('vc',{email:email.toLowerCase(),code,exp:Date.now()+10*60000});
  return code;
}
function checkCode(email,input){
  const v=sess.get('vc',null);
  if(!v||v.email!==email.toLowerCase()) return 'none';
  if(Date.now()>v.exp) return 'exp';
  return v.code===input?'ok':'bad';
}
function codeBlock(title){
  return '<div class="codebox"><b>'+(title||'Verifica tu correo')+'</b><div class="hint" style="margin:2px 0 8px">Te enviamos un código de 6 dígitos al correo. Caduca en 10 minutos.</div><button type="button" class="ghostbtn sm" data-act="sendcode">Enviar código</button><div id="cbody"></div></div>';
}
function showCodes(code){
  $('#cbody').innerHTML='<div class="codes">'+[0,1,2,3,4,5].map(i=>'<input inputmode="numeric" maxlength="1" aria-label="Dígito '+(i+1)+'">').join('')+'</div><div class="hint">¿No llegó? Revisa spam o <button type="button" class="linkbtn" data-act="sendcode">reenviar código</button>.</div>'+
    (SHEETS_ACTIVO()?'':'<div class="demo">Modo demo: el correo no se envía todavía. Tu código es '+code+'</div>');
  const ins=$$('#cbody .codes input');
  ins.forEach((el,i)=>{
    el.addEventListener('input',()=>{el.value=el.value.replace(/\D/g,'');if(el.value&&ins[i+1])ins[i+1].focus();});
    el.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!el.value&&ins[i-1])ins[i-1].focus();});
    el.addEventListener('paste',e=>{const t=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(t){e.preventDefault();ins.forEach((x,k)=>x.value=t[k]||'');ins[Math.min(t.length,5)].focus();}});
  });
  ins[0].focus();
}
const readCode=()=>$$('#cbody .codes input').map(x=>x.value).join('');
/* envía el código por correo y muestra el resultado real debajo de las casillas */
function dispatchCode(em,code){
  if(!SHEETS_ACTIVO()){ toast('Modo demo: el correo no se envía todavía.'); return; }
  const st=$('#cbody'); const note=document.createElement('div'); note.className='hint'; note.id='sendst'; note.textContent='Enviando el código a '+em+'…'; st.prepend(note);
  enviarCodigoCorreo(em.toLowerCase(),code).then(r=>{
    const n=$('#sendst'); if(!n) return;
    if(r.ok){ n.textContent=r.unsure?'Enviamos el código a '+em+'. Si no llega en un minuto, revisa spam.':'✓ Código enviado a '+em+'. Revisa también spam.'; toast('Código enviado a '+em); }
    else{ n.style.color='#b3261e'; n.textContent='No se pudo enviar el correo: '+r.msg; }
  });
}
ACT.sendcode=()=>{
  const em=($('#f-mail').value||'').trim();
  if(!validEmail(em)){setErr('Escribe un correo válido para enviarte el código.');return;}
  setErr(''); const code=sendCode(em); showCodes(code);
  dispatchCode(em,code);
};
function setErr(t){const e=$('#merr');if(e)e.textContent=t;}
function codeError(email){
  const c=readCode();
  if(!$('#cbody .codes')) return 'Primero pulsa “Enviar código”.';
  if(c.length<6) return 'Escribe los 6 dígitos del código.';
  const r=checkCode(email,c);
  return r==='ok'?'':r==='exp'?'El código caducó. Pide uno nuevo.':'El código no es correcto.';
}
function afterLogin(){const a=sess.get('after',null);sess.del('after');go(a||'/');}

/* ---- ingreso ---- */
let _lrol='comprador', _lpend=null;
function renderLogin(){
  renderInicio();
  openModal('<h2>Inicia sesión</h2><p class="sub">Entra para reservar o gestionar tu perfil.</p>'+
   '<div class="seg"><button data-act="lrol" data-r="comprador" class="'+(_lrol==='comprador'?'on':'')+'">Soy comensal</button><button data-act="lrol" data-r="chef" class="'+(_lrol==='chef'?'on':'')+'">Soy chef</button></div>'+
   '<div id="lbody">'+loginForm()+'</div><div class="divider">o</div><div style="text-align:center">¿Aún no tienes cuenta? <a href="#/registro" style="font-weight:700">Crear cuenta</a> · <a href="#/registro-chef" style="font-weight:700">Quiero ser chef</a></div>');
  _lpend=null;
}
function loginForm(){
  return '<label class="field"><span>Correo electrónico</span><input id="l-mail" type="email" autocomplete="email"></label><label class="field"><span>Contraseña</span><input id="l-pass" type="password" autocomplete="current-password"></label>'+
   (_lrol==='chef'?'<p class="hint">Por seguridad, a los chefs les enviamos además un código a su correo.</p>':'')+'<div id="merr" class="err" role="alert"></div><button class="btn block" data-act="entrar">Entrar</button>';
}
ACT.lrol=el=>{_lrol=el.dataset.r;renderLogin();};
ACT.entrar=async()=>{
  const em=($('#l-mail').value||'').trim().toLowerCase(), pw=$('#l-pass').value;
  const u=Users.byEmail(em);
  if(!validEmail(em)||!pw) return setErr('Escribe tu correo y contraseña.');
  if(!u||u.pass!==await sha256(pw)) return setErr('Correo o contraseña incorrectos.');
  if(u.rol!==_lrol) return setErr(u.rol==='chef'?'Esta cuenta es de chef. Usa la pestaña “Soy chef”.':'Esta cuenta es de comensal. Usa la pestaña “Soy comensal”.');
  if(u.rol==='chef'){
    _lpend=em; const code=sendCode(em);
    $('#lbody').innerHTML='<div class="codebox"><b>Código de seguridad</b><div class="hint">Lo enviamos a '+esc(em)+'.</div><div id="cbody"></div></div><div id="merr" class="err" role="alert"></div><button class="btn block" data-act="lcode">Verificar y entrar</button>';
    showCodes(code); dispatchCode(em,code); return;
  }
  Session.login(em); toast('¡Hola, '+u.nombre.split(' ')[0]+'!'); afterLogin();
};
ACT.lcode=()=>{
  const e=codeError(_lpend); if(e) return setErr(e);
  Session.login(_lpend); const u=Session.user(); toast('¡Hola, '+u.nombre.split(' ')[0]+'!');
  const a=sess.get('after',null); if(a){afterLogin();} else go('/mi-perfil');
};

/* ---- registro de comprador ---- */
function renderRegistro(){
  renderInicio();
  openModal('<h2>Crea tu cuenta</h2><p class="sub">Reserva chefs caribeños en minutos.</p>'+
   '<label class="field"><span>Nombre completo</span><input id="f-nom" autocomplete="name" maxlength="60"></label>'+
   '<label class="field"><span>Correo electrónico</span><input id="f-mail" type="email" autocomplete="email"></label>'+
   '<label class="field"><span>Contraseña</span><input id="f-pass" type="password" autocomplete="new-password"></label><div class="hint">Mínimo 8 caracteres, con letras y números.</div>'+
   '<div class="row"><label class="field" style="flex:0 0 42%"><span>Indicativo</span><select id="f-cc">'+codeOpts()+'</select></label><label class="field"><span>Celular</span><input id="f-tel" inputmode="numeric" maxlength="12" autocomplete="tel-national"></label></div>'+
   codeBlock()+
   '<label class="check"><input type="checkbox" id="f-term"> Acepto los términos y la política de privacidad.</label><div id="merr" class="err" role="alert"></div><button class="btn block" data-act="crearcuenta">Crear cuenta</button>'+
   '<div style="text-align:center;margin-top:14px">¿Ya tienes cuenta? <a href="#/login" style="font-weight:700">Inicia sesión</a></div>',{back:true});
}
function validateBasics(pre){
  const nom=$('#f-nom').value.trim(), em=$('#f-mail').value.trim().toLowerCase(), pw=$('#f-pass').value, tel=$('#f-tel').value.replace(/\D/g,'');
  if(nom.length<3||!nom.includes(' ')&&nom.length<4) return 'Escribe tu nombre completo.';
  if(!validEmail(em)) return 'Escribe un correo válido.';
  if(Users.byEmail(em)) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
  if(!validPass(pw)) return 'La contraseña necesita 8 caracteres, con letras y números.';
  if(tel.length<7||tel.length>12) return 'Escribe un número de celular válido.';
  return '';
}
ACT.crearcuenta=async()=>{
  let e=validateBasics(); if(e) return setErr(e);
  const em=$('#f-mail').value.trim().toLowerCase();
  e=codeError(em); if(e) return setErr(e);
  if(!$('#f-term').checked) return setErr('Acepta los términos para continuar.');
  const u={email:em,nombre:$('#f-nom').value.trim(),pass:await sha256($('#f-pass').value),telefono:$('#f-cc').value+' '+$('#f-tel').value.replace(/\D/g,''),rol:'comprador',creado:new Date().toISOString()};
  const a=Users.all();a.push(u);Users.save(a);
  enviarASheets({tipo:'registro',rol:'comprador',nombre:u.nombre,correo:u.email,telefono:u.telefono});
  Session.login(em); toast('¡Cuenta creada! Bienvenido, '+u.nombre.split(' ')[0]+'.'); afterLogin();
};

/* ---- registro de chef, paso 1: cuenta y correo ---- */
let _cd=null;           // datos del paso 1 (en memoria)
let _cp={foto:null,fotos:[],docName:'',certName:'',docFoto:''}; // archivos del paso 2
const stepsHtml=n=>'<div class="steps"><div class="'+(n===1?'on':'')+'"><i>1</i>Cuenta</div><u></u><div class="'+(n===2?'on':'')+'"><i>2</i>Datos</div></div>';
function renderRegistroChef(){
  renderInicio(); _cd=null; _cp={foto:null,fotos:[],docName:'',certName:'',docFoto:''};
  openModal('<h2>Sé chef en Sabor Caribeño</h2><p class="sub">Paso 1 de 2 · crea tu cuenta y verifica tu correo.</p>'+stepsHtml(1)+
   '<label class="field"><span>Nombre completo</span><input id="f-nom" autocomplete="name" maxlength="60"></label>'+
   '<label class="field"><span>Correo electrónico</span><input id="f-mail" type="email" autocomplete="email"></label>'+
   '<label class="field"><span>Contraseña</span><input id="f-pass" type="password" autocomplete="new-password"></label><div class="hint">Mínimo 8 caracteres, con letras y números.</div>'+
   '<div class="row"><label class="field" style="flex:0 0 42%"><span>Indicativo</span><select id="f-cc">'+codeOpts()+'</select></label><label class="field"><span>Celular / WhatsApp</span><input id="f-tel" inputmode="numeric" maxlength="12"></label></div>'+
   codeBlock()+'<div id="merr" class="err" role="alert"></div><button class="btn block" data-act="chefpaso1">Verificar</button>'+
   '<div style="text-align:center;margin-top:14px">¿Ya eres chef aquí? <a href="#/login" style="font-weight:700">Inicia sesión</a></div>',{back:true});
}
ACT.chefpaso1=async()=>{
  let e=validateBasics(); if(e) return setErr(e);
  const em=$('#f-mail').value.trim().toLowerCase();
  e=codeError(em); if(e) return setErr(e);
  _cd={nombre:$('#f-nom').value.trim(),email:em,pass:await sha256($('#f-pass').value),telefono:$('#f-cc').value+' '+$('#f-tel').value.replace(/\D/g,'')};
  go('/registro-chef-datos');
};

/* ---- paso 2: datos ---- */
function photoGrid(list,act,max){
  return '<div class="photos">'+list.map((p,i)=>'<div class="ph" style="background-image:url('+p+')"><button type="button" data-act="'+act+'del" data-i="'+i+'" aria-label="Quitar foto">×</button></div>').join('')+(list.length<max?'<label class="add" aria-label="Agregar foto">+<input type="file" accept="image/*" multiple data-file="'+act+'"></label>':'')+'</div>';
}
function renderChefDatos(){
  if(!_cd){go('/registro-chef');return;}
  renderInicio(); const c0=CITIES[0];
  openModal('<h2>Cuéntanos de tu cocina</h2><p class="sub">Paso 2 de 2 · datos de tu perfil.</p>'+stepsHtml(2)+
   '<div class="sect" style="margin-top:6px">Fotos</div><div id="g-foto">'+fotoPerfil()+'</div><div id="g-plat">'+platosHtml()+'</div>'+
   '<label class="field"><span>Cuéntales quién eres</span><textarea id="d-bio" maxlength="400" placeholder="Tu historia, tu sazón, qué te hace especial"></textarea></label>'+
   '<div class="sect">Verificación</div><div class="row"><label class="field"><span>Documento</span><select id="d-dt"><option>Cédula</option><option>Pasaporte</option><option>Cédula de extranjería</option></select></label><label class="field"><span>Número</span><input id="d-dn" maxlength="20"></label></div>'+
   '<label class="up" id="up-doc"><input type="file" data-file="doc" accept="image/*,application/pdf"><b>Foto del documento</b><small>Solo se usa para verificarte</small></label>'+
   '<div class="row"><label class="field"><span>Institución certificadora</span><input id="d-ci" maxlength="60" placeholder="SENA, instituto…"></label><label class="field"><span>N.º de certificado</span><input id="d-cn" maxlength="20"></label></div>'+
   '<label class="up" id="up-cert"><input type="file" data-file="cert" accept="application/pdf,image/*"><b>Certificado en PDF</b><small>PDF o imagen</small></label>'+
   '<div class="sect">Tu cocina</div><div class="row"><label class="field"><span>Años de experiencia</span><input id="d-y" type="number" min="0" max="60"></label><label class="field"><span>Precio por persona (USD)</span><input id="d-p" type="number" min="20" max="120"></label></div>'+
   '<label class="field"><span>Platos que cocinas (separados por coma)</span><input id="d-pl" placeholder="Arroz de coco, Posta cartagenera"></label>'+
   '<div class="row"><label class="field"><span>Ciudad</span><select id="d-ci2" data-act="ciudadsel">'+CITIES.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('')+'</select></label><label class="field"><span>Zona o barrio</span><select id="d-z">'+c0.zones.map(z=>'<option>'+esc(z[0])+'</option>').join('')+'</select></label></div>'+
   '<div class="row"><label class="field"><span>Atiendes desde</span><select id="d-h1">'+HOURS.map(h=>'<option value="'+h+'">'+fmtHour(h)+'</option>').join('')+'</select></label><label class="field"><span>Hasta</span><select id="d-h2">'+HOURS.map(h=>'<option value="'+h+'"'+(h==='21:00'?' selected':'')+'>'+fmtHour(h)+'</option>').join('')+'</select></label></div>'+
   '<label class="check"><input type="checkbox" id="d-term"> Confirmo que mis datos son reales y acepto los términos para chefs.</label><div id="merr" class="err" role="alert"></div><button class="btn block" data-act="chefcrear">Crear perfil de chef</button>',{wide:true,back:true});
  $('#d-ci2').addEventListener('change',()=>{const c=cityById($('#d-ci2').value);$('#d-z').innerHTML=c.zones.map(z=>'<option>'+esc(z[0])+'</option>').join('');});
}
const fotoPerfil=()=>'<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">'+avatar(_cp.foto,72,'Tu foto de perfil')+'<label class="ghostbtn sm" style="cursor:pointer">'+(_cp.foto?'Cambiar foto de perfil':'Subir foto de perfil')+'<input type="file" accept="image/*" data-file="perfil" style="display:none"></label></div>';
const platosHtml=()=>'<div class="hint" style="margin:0 0 6px">Fotos de tus platos (mínimo 3, máximo 8)</div>'+photoGrid(_cp.fotos,'plato',8);
document.addEventListener('change',async e=>{
  const t=e.target; if(!t.dataset||!t.dataset.file) return;
  const k=t.dataset.file, files=Array.from(t.files||[]); if(!files.length) return;
  try{
    if(k==='perfil'){_cp.foto=await readImage(files[0],400);$('#g-foto').innerHTML=fotoPerfil();}
    else if(k==='plato'){for(const f of files){if(_cp.fotos.length<8)_cp.fotos.push(await readImage(f,720));}$('#g-plat').innerHTML=platosHtml();}
    else if(k==='editplato'){return editAddPhotos(files);}
    else if(k==='editperfil'){return editSetProfile(files[0]);}
    else if(k==='doc'){_cp.docName=files[0].name;$('#up-doc').classList.add('has');$('#up-doc b').textContent=files[0].name;}
    else if(k==='cert'){_cp.certName=files[0].name;$('#up-cert').classList.add('has');$('#up-cert b').textContent=files[0].name;}
  }catch(err){toast(err.message||'No se pudo cargar el archivo.');}
});
ACT.platodel=el=>{_cp.fotos.splice(+el.dataset.i,1);$('#g-plat').innerHTML=platosHtml();};
ACT.chefcrear=()=>{
  const g=id=>($('#'+id).value||'').trim(), setE=setErr;
  if(!_cd) return go('/registro-chef');
  if(!_cp.foto) return setE('Sube tu foto de perfil.');
  if(_cp.fotos.length<3) return setE('Sube al menos 3 fotos de tus platos.');
  if(g('d-bio').length<20) return setE('Cuéntanos un poco más sobre ti (mínimo 20 letras).');
  if(g('d-dn').length<5) return setE('Escribe el número de tu documento.');
  if(!_cp.docName) return setE('Sube la foto de tu documento.');
  if(g('d-ci').length<3||g('d-cn').length<2) return setE('Completa tu certificación culinaria.');
  if(!_cp.certName) return setE('Sube tu certificado.');
  const y=+g('d-y'), p=+g('d-p');
  if(!(y>=0&&g('d-y')!=='')||y>60) return setE('Escribe tus años de experiencia.');
  if(!(p>=20&&p<=120)) return setE('El precio por persona debe estar entre US$20 y US$120.');
  const platos=g('d-pl').split(',').map(s=>s.trim()).filter(Boolean).slice(0,6);
  if(!platos.length) return setE('Escribe al menos un plato.');
  const h1=$('#d-h1').value,h2=$('#d-h2').value; if(mins(h2)<=mins(h1)) return setE('La hora final debe ser después de la inicial.');
  if(!$('#d-term').checked) return setE('Acepta los términos para continuar.');
  const city=cityById($('#d-ci2').value), zn=$('#d-z').value, z=city.zones.find(x=>x[0]===zn)||[zn,city.lat,city.lon];
  const user={email:_cd.email,nombre:_cd.nombre,pass:_cd.pass,telefono:_cd.telefono,rol:'chef',creado:new Date().toISOString()};
  const us=Users.all(); if(us.some(u=>u.email===user.email)) return setE('Ese correo ya tiene cuenta.'); us.push(user);
  const chef={id:'u'+Date.now().toString(36),email:user.email,name:user.nombre,city:city.id,zone:zn,lat:z[1],lon:z[2],dishes:platos,price:p,years:y,cert:g('d-ci')+' #'+g('d-cn'),bio:g('d-bio'),
    hours:{from:h1,to:h2},foto:_cp.foto,fotos:_cp.fotos.slice(),wa:_cd.telefono.replace(/\D/g,''),verified:false,seed:false,reviews:[],docTipo:g('d-dt'),docNum:g('d-dn')};
  if(!saveChef(chef)) return setE('No hay espacio para guardar las fotos. Usa menos fotos o más pequeñas.');
  Users.save(us);
  enviarASheets({tipo:'registro',rol:'chef',nombre:user.nombre,correo:user.email,telefono:user.telefono,ciudad:city.name,zona:zn,platos:platos.join(', '),precio:p,anos:y,certificacion:chef.cert,documento:chef.docTipo+' '+chef.docNum,horario:h1+'-'+h2});
  Session.login(user.email); _cd=null; _cp={foto:null,fotos:[],docName:'',certName:'',docFoto:''};
  toast('¡Listo! Tu perfil de chef ya está creado.'); go('/mi-perfil');
};

route('/login',renderLogin);
route('/registro',renderRegistro);
route('/registro-chef',renderRegistroChef);
route('/registro-chef-datos',renderChefDatos);
