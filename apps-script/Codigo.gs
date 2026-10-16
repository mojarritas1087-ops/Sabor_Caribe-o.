/**
 * Sabor Caribeño - Un solo script para:
 *   1) Enviar por correo el CÓDIGO DE VERIFICACIÓN.
 *   2) Enviar por correo la CONFIRMACIÓN DE RESERVA al comprador (y copia a ti, el administrador),
 *      y avisar al comprador cuando el chef acepta/rechaza.
 *   3) (Opcional) Guardar registros, reservas y reportes en Google Sheets.
 *
 * Si no vas a usar Google Sheets, deja ID_HOJA como está: los correos funcionan igual.
 * Los correos salen desde la cuenta de Gmail con la que creas este script (límite ~100 al día).
 */
const ID_HOJA = 'PEGA_AQUI_EL_ID';          // opcional: ID de tu hoja (lo que está entre /d/ y /edit)
const NOMBRE = 'Sabor Caribeño';

const ENC_REGISTROS = ['Fecha','Rol','Nombre','Correo','Teléfono','Ciudad','Zona','Platos','Precio USD','Años','Certificación','Documento','Horario'];
const ENC_RESERVAS  = ['ID reserva','Fecha de registro','Estado','Fecha del servicio','Hora','Chef','Comprador','Correo','Teléfono','Comensales','Dirección','Alergias / notas','Método de pago','Moneda','Total (moneda elegida)','Oferta','Código promo'];
const ENC_REPORTES  = ['Fecha','Chef','Reportado por','Motivo'];

const hojaActiva = () => ID_HOJA && ID_HOJA.indexOf('PEGA_AQUI') !== 0;
const esCorreo = c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c || '');
const h = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function doPost(e) {
  try {
    if (!e || !e.postData) return ContentService.createTextOutput('sin datos');
    const d = JSON.parse(e.postData.contents);
    if (d.tipo === 'codigo') enviarCodigo(d);
    else if (d.tipo === 'reserva') { try { if (hojaActiva()) guardarReserva(d); } catch (x) {} correoReserva(d); }
    else if (d.tipo === 'estado') { try { if (hojaActiva()) actualizarEstado(d); } catch (x) {} correoEstado(d); }
    else if (d.tipo === 'reporte') { if (hojaActiva()) guardarReporte(d); }
    else { if (hojaActiva()) guardarRegistro(d); }
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}
function doGet() { return ContentService.createTextOutput('El servicio está activo'); }

/* ---------- correos ---------- */
function marco(titulo, cuerpo) {
  return '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e4efd3;border-radius:14px;overflow:hidden">' +
    '<div style="background:#0D3B1E;color:#F7E58A;padding:16px 20px;font-size:20px;font-weight:bold">' + NOMBRE + '</div>' +
    '<div style="padding:20px;color:#14261a"><h2 style="margin:0 0 12px">' + titulo + '</h2>' + cuerpo + '</div></div>';
}
function enviarCodigo(d) {
  if (!esCorreo(d.correo) || !/^\d{6}$/.test(String(d.codigo))) return;
  MailApp.sendEmail({
    to: d.correo, name: NOMBRE,
    subject: 'Tu código de verificación de ' + NOMBRE,
    htmlBody: marco('Tu código de verificación', '<p>Usa este código para continuar:</p><p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:8px 0">' + h(d.codigo) + '</p><p style="color:#555">Caduca en 10 minutos. Si no lo pediste, ignora este correo.</p>')
  });
}
function filasReserva(d) {
  const f = (a, b) => '<tr><td style="padding:6px 0;color:#555">' + a + '</td><td style="padding:6px 0;text-align:right"><b>' + h(b) + '</b></td></tr>';
  return '<table style="width:100%;border-collapse:collapse;border-top:1px solid #eee">' +
    f('Reserva', '#' + d.id) + f('Chef', d.chef) + f('Fecha', d.fecha) + f('Hora', d.hora) + f('Comensales', d.comensales) +
    f('Dirección', d.direccion) + (d.alergias ? f('Notas / alergias', d.alergias) : '') +
    f('Pago', d.metodo + ' · ' + d.moneda) + f('Total', d.total) + (d.oferta ? f('Oferta', d.oferta) : '') + '</table>';
}
function correoReserva(d) {
  const admin = Session.getEffectiveUser().getEmail();
  if (esCorreo(d.correo)) {
    MailApp.sendEmail({
      to: d.correo, name: NOMBRE, replyTo: admin,
      subject: 'Recibimos tu reserva #' + d.id + ' con ' + d.chef,
      htmlBody: marco('¡Reserva recibida!', '<p>Hola ' + h(d.comprador) + ', tu solicitud quedó <b>pendiente</b> hasta que el chef la acepte. Te avisaremos por este medio.</p>' + filasReserva(d))
    });
  }
  if (esCorreo(admin)) {
    MailApp.sendEmail({
      to: admin, name: NOMBRE, subject: 'Nueva reserva #' + d.id + ' — ' + d.chef,
      htmlBody: marco('Nueva reserva', '<p>Comprador: <b>' + h(d.comprador) + '</b> · ' + h(d.correo) + ' · ' + h(d.telefono) + '</p>' + filasReserva(d))
    });
  }
}
function correoEstado(d) {
  if (!esCorreo(d.correo)) return;
  const txt = { aceptado: 'fue <b>aceptada</b> 🎉. ¡El chef llegará en la fecha y hora acordadas!', rechazado: 'no pudo ser aceptada por el chef. Puedes elegir otro chef desde la página.', cancelado: 'fue <b>cancelada</b>.', completado: 'quedó <b>completada</b>. ¡Gracias por elegirnos!' }[d.estado];
  if (!txt) return;
  MailApp.sendEmail({
    to: d.correo, name: NOMBRE,
    subject: 'Tu reserva #' + d.id + ': ' + d.estado,
    htmlBody: marco('Actualización de tu reserva', '<p>Tu reserva #' + h(d.id) + (d.chef ? ' con ' + h(d.chef) : '') + (d.fecha ? ' (' + h(d.fecha) + ' ' + h(d.hora || '') + ')' : '') + ' ' + txt + '</p>')
  });
}

/* ---------- Google Sheets (opcional) ---------- */
function hoja(nombre, enc) {
  const ss = SpreadsheetApp.openById(ID_HOJA);
  let sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  if (sh.getLastRow() === 0) { sh.appendRow(enc); sh.setFrozenRows(1); }
  return sh;
}
function guardarRegistro(d) {
  hoja('Registros', ENC_REGISTROS).appendRow([new Date(), d.rol, d.nombre, d.correo, "'" + (d.telefono || ''),
    d.ciudad || '', d.zona || '', d.platos || '', d.precio || '', d.anos || '', d.certificacion || '', d.documento || '', d.horario || '']);
}
function guardarReserva(d) {
  hoja('Reservas', ENC_RESERVAS).appendRow(["'" + d.id, new Date(), d.estado || 'pendiente', d.fecha, d.hora, d.chef, d.comprador, d.correo,
    "'" + (d.telefono || ''), d.comensales, d.direccion, d.alergias || '', d.metodo, d.moneda, d.total, d.oferta || '', d.codigo || '']);
}
function actualizarEstado(d) {
  const sh = hoja('Reservas', ENC_RESERVAS), n = sh.getLastRow();
  if (n < 2) return;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).replace("'", '') === String(d.id)) { sh.getRange(i + 2, 3).setValue(d.estado); return; }
  }
}
function guardarReporte(d) {
  hoja('Reportes', ENC_REPORTES).appendRow([new Date(), d.chef, d.reporta, d.motivo]);
}

/* ---------- Pruebas: elígelas arriba y pulsa "Ejecutar" (nunca doPost) ---------- */
/* Ejecuta ESTA primero: te pedirá permisos y te enviará un correo de prueba. */
function probarCodigo() { enviarCodigo({ correo: Session.getEffectiveUser().getEmail(), codigo: '123456' }); }
function probarReserva() {
  const yo = Session.getEffectiveUser().getEmail();
  correoReserva({ id: 'RTEST', chef: 'Chef de prueba', comprador: 'Prueba', correo: yo, telefono: '+57 3000000000', fecha: '2026-10-20', hora: '19:00',
    comensales: 2, direccion: 'Calle 1 #2-3', metodo: 'tarjeta', moneda: 'USD', total: 91.48 });
}
