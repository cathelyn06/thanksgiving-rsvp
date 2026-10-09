/**
 * Thanksgiving RSVP backend. Paste this into the Apps Script editor of a Google Sheet
 * (Extensions > Apps Script) and deploy it as a web app. See README.md.
 *
 * GET  -> { ok: true, rsvps: [...] }   (public list, notes left out)
 * POST -> saves or updates one RSVP (matched by name), returns the same list
 */
const SHEET_NAME = 'RSVPs';
const HEADERS = ['Updated', 'Name', 'Going', 'Party', 'Sambal', 'Dessert', 'Bringing', 'Note'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

// Stop text like "=SUM(...)" from turning into a formula in the sheet.
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function list_() {
  const sh = sheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues()
    .filter(r => r[1])
    .map(r => ({
      at: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]),
      going: String(r[2]),
      party: Number(r[3]) || 0,
      sambal: String(r[4]),
      dessert: String(r[5]),
      bring: String(r[6])
    }));
}

function doGet() {
  return json_({ ok: true, rsvps: list_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ ok: true, rsvps: list_() }); // bot trap field was filled in

    const name = clean_(d.name, 60);
    const going = ['yes', 'maybe', 'no'].indexOf(d.going) > -1 ? d.going : '';
    if (!name || !going) return json_({ ok: false, error: 'Name and attendance are required.' });

    const attending = going !== 'no';
    const party = attending ? Math.min(8, Math.max(1, parseInt(d.party, 10) || 1)) : 0;
    const sambal = attending && ['matah', 'bawang', 'both'].indexOf(d.sambal) > -1 ? d.sambal : '';
    const dessert = attending && ['bake', 'bring'].indexOf(d.dessert) > -1 ? d.dessert : '';
    const bring = dessert === 'bring' ? clean_(d.bring, 80) : '';
    const note = clean_(d.note, 200);
    const row = [new Date(), safe_(name), going, party, sambal, dessert, safe_(bring), safe_(note)];

    const sh = sheet_();
    let target = -1;
    if (sh.getLastRow() >= 2) {
      const names = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0]).trim().toLowerCase() === name.toLowerCase()) { target = i + 2; break; }
      }
    }
    if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    return json_({ ok: true, rsvps: list_() });
  } catch (err) {
    return json_({ ok: false, error: 'Could not save that RSVP.' });
  } finally {
    lock.releaseLock();
  }
}
