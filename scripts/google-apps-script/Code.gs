/**
 * Google Apps Script — Austin Arena Ganeshotsav registrations
 * ----------------------------------------------------------
 * Paste this into Extensions → Apps Script of your Google Sheet, then deploy
 * as a Web App (Execute as: Me, Who has access: Anyone).
 *
 * Two callers are supported:
 *
 * 1. Server deployments (Vercel) — the /api/register route posts JSON and
 *    keeps GOOGLE_SHEETS_SHARED_SECRET private.
 * 2. Static deployments (GitHub Pages) — the browser posts directly with a
 *    `text/plain` body. That keeps it a CORS "simple request", because Apps
 *    Script cannot answer the preflight an `application/json` body triggers.
 *
 * The body is read from e.postData.contents either way, so the content type
 * does not matter here.
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

/** Health check — open the /exec URL in a browser to confirm the deployment. */
function doGet() {
  return json({ ok: true, service: 'ganeshotsav-registrations' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');

    if (expected && body.secret !== expected) {
      return json({ ok: false, message: 'Unauthorized' });
    }

    // Reject obvious bot traffic that filled the hidden honeypot field.
    if (body.website) {
      return json({ ok: false, message: 'Invalid submission' });
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

