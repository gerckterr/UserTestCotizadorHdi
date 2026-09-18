/**
 * Test de usabilidad — Cotizador Auto (HDI)
 * Web App de Google Apps Script que recibe las respuestas del test (POST con
 * JSON) y las guarda en la hoja de cálculo activa: una fila por sesión,
 * identificada por session_id. Si la fila ya existe, se actualiza en vez de
 * duplicarse (así los abandonos a la mitad del test también quedan
 * registrados).
 *
 * Instalación (ver README.md del proyecto para el detalle paso a paso):
 * 1. Crea una Google Sheet nueva.
 * 2. Extensiones → Apps Script, borra el contenido y pega este archivo.
 * 3. Implementar → Nueva implementación → Aplicación web.
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 4. Copia la URL del Web App y pégala en SHEETS_URL, arriba de app.js.
 */

var SHEET_NAME = 'Respuestas';
var ID_COLUMN = 'session_id';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet_();
    upsertRow_(sheet, data);
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  return jsonOutput_({ ok: true, msg: 'Web App activo. Usa POST para enviar respuestas.' });
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function upsertRow_(sheet, data) {
  var headers = getHeaders_(sheet);

  // Asegura que exista la columna de id y todas las columnas que trae el payload.
  headers = ensureHeaders_(sheet, headers, [ID_COLUMN].concat(Object.keys(data)));

  var idIndex = headers.indexOf(ID_COLUMN);
  var targetRow = findRowBySessionId_(sheet, idIndex + 1, data[ID_COLUMN]);

  var lastCol = headers.length;
  var existing = targetRow > 0 ? sheet.getRange(targetRow, 1, 1, lastCol).getValues()[0] : new Array(lastCol).fill('');

  var rowValues = headers.map(function (h, i) {
    if (Object.prototype.hasOwnProperty.call(data, h)) {
      var v = data[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    }
    return existing[i] !== undefined ? existing[i] : '';
  });

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, lastCol).setValues([rowValues]);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, lastCol).setValues([rowValues]);
  }
}

function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) return [];
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  // corta strings vacíos al final
  while (row.length && row[row.length - 1] === '') row.pop();
  return row;
}

// Agrega al final las columnas de `wanted` que todavía no existan, y
// reescribe el encabezado si hubo cambios. Devuelve el arreglo de headers final.
function ensureHeaders_(sheet, headers, wanted) {
  var set = {};
  headers.forEach(function (h) { set[h] = true; });
  var next = headers.slice();
  wanted.forEach(function (h) {
    if (!set[h]) { set[h] = true; next.push(h); }
  });
  if (next.length !== headers.length) {
    sheet.getRange(1, 1, 1, next.length).setValues([next]);
  }
  return next;
}

function findRowBySessionId_(sheet, col, sessionId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || !sessionId) return -1;
  var ids = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === sessionId) return i + 2;
  }
  return -1;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
