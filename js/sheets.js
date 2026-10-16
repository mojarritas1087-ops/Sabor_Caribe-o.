/* Conexión con Google Sheets (y envío de correos con el código de verificación).
   Pega aquí la URL de tu Apps Script: la que termina en /exec.
   Si la dejas sin configurar, la página funciona igual, pero no escribe en la hoja ni envía correos. */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwbDfV5B1gR_nYiXKhfFa-4kW1Zfx9MjKYn9XWTZ-Ab0RILwbolYUbebW0-c99t8pHy/exec';

const SHEETS_ACTIVO = () => !!SHEETS_URL && SHEETS_URL.indexOf('PEGA_AQUI') !== 0;

function enviarASheets(payload){
  if(!SHEETS_ACTIVO()) return;
  try{
    fetch(SHEETS_URL,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload)
    }).catch(()=>{});
  }catch(e){}
}

/* Envía el código y devuelve {ok,msg} leyendo la respuesta real del Apps Script (para poder avisar si falla). */
async function enviarCodigoCorreo(correo,codigo){
  if(!SHEETS_ACTIVO()) return {ok:false,demo:true,msg:'La URL del Apps Script no está configurada en js/sheets.js.'};
  try{
    const r=await fetch(SHEETS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({tipo:'codigo',correo,codigo}),redirect:'follow'});
    const t=(await r.text()).trim();
    if(t==='ok') return {ok:true};
    return {ok:false,msg:t.slice(0,200)||('Respuesta inesperada ('+r.status+')')};
  }catch(e){
    /* si el navegador bloquea leer la respuesta, igual lo intentamos a ciegas */
    enviarASheets({tipo:'codigo',correo,codigo});
    return {ok:true,unsure:true};
  }
}
