/**
 * Google Apps Script — Austin Arena Ganeshotsav registrations
 * ----------------------------------------------------------
 * Paste this into Extensions → Apps Script of your Google Sheet, then deploy
 * as a Web App (Execute as: Me, Who has access: Anyone).
 *
 * Copy the deployment URL into GOOGLE_SHEETS_WEBAPP_URL and set the same
 * secret in both Script Properties and GOOGLE_SHEETS_SHARED_SECRET.
 */

const SHEET_NAME = 'Registrations';

const HEADERS = [
  'Submitted At',
  'Resident Name',
  'Flat',
  'Mobile',
  'Email',
  'Participant Name',
  'Participant Age',
  'Event',
  'Event Id',
  'Comments',
  'Consent',
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');

    if (expected && body.secret !== expected) {
      return json({ ok: false, message: 'Unauthorized' });
    }

    const sheet = getSheet();

    sheet.appendRow([
      body.submittedAt || new Date().toISOString(),
      body.residentName || '',
      body.flat || '',
      body.mobile || '',
      body.email || '',
      body.participantName || '',
      body.participantAge || '',
      body.eventName || '',
      body.eventId || '',
      body.comments || '',
      body.consent ? 'Yes' : 'No',
    ]);

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: String(error) });
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

