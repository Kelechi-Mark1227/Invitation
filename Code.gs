/**
 * RSVP → Google Sheet backend for Jane & Nicholas's invitation.
 *
 * SETUP (see RSVP-BACKEND-SETUP.md for full step-by-step instructions):
 * 1. Create a Google Sheet, name the first sheet tab "RSVPs".
 * 2. Extensions → Apps Script, paste this whole file in, save.
 * 3. Deploy → New deployment → type "Web app" → Execute as "Me",
 *    Who has access "Anyone" → Deploy → copy the Web app URL.
 * 4. Paste that URL into GOOGLE_SHEET_ENDPOINT in script.js.
 */

const SHEET_NAME = 'RSVPs';
const HEADERS = ['Timestamp', 'Full Name', 'Phone Number', 'Attending', 'Message'];

function doPost(e) {
  try {
    const sheet = getSheet_();
    const data = JSON.parse(e.postData.contents);

    const attendingLabel =
      data.attendance === 'yes' ? 'Joyfully Accept' :
      data.attendance === 'no'  ? "Won't be able to make it" :
      (data.attendance || '');

    sheet.appendRow([
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      data.name || '',
      data.phone || '',
      attendingLabel,
      data.message || ''
    ]);

    return jsonResponse_({ result: 'success' });
  } catch (err) {
    return jsonResponse_({ result: 'error', message: String(err) });
  }
}

// Lets you open the Web app URL directly in a browser to sanity-check it's live.
function doGet() {
  return jsonResponse_({ result: 'ok', message: 'RSVP endpoint is live.' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
