/**
 * EMAIL AUTOMATION SCRIPT
 * ========================
 * Reads contacts from a Google Sheet and sends personalized bulk emails via Gmail.
 * Tracks sent status back to the sheet, supports scheduling, and respects rate limits.
 *
 * SHEET SETUP (tab named "Contacts"):
 *   Column A: Name
 *   Column B: Email
 *   Column C: Company (optional - used in personalization)
 *   Column D: Custom Field (optional - e.g. product name, amount)
 *   Column E: Status (auto-filled: "Sent", "Failed", or blank)
 *   Column F: Sent Timestamp (auto-filled)
 *
 * HOW TO USE:
 *   1. Paste this script in Tools > Script Editor
 *   2. Set your email subject and body template in CONFIG below
 *   3. Run sendBulkEmails() manually, or set up a trigger for scheduling
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────────
var CONFIG = {
  SHEET_NAME: "Contacts",         // Tab name containing contacts
  EMAIL_SUBJECT: "A message from us, {{Name}}",
  EMAIL_BODY: `Hi {{Name}},

Thank you for your interest{{#Company}} from {{Company}}{{/Company}}.

We wanted to reach out regarding {{CustomField}}.

If you have any questions, simply reply to this email.

Best regards,
Your Name
Your Company
your@email.com`,

  SENDER_NAME: "Your Name",       // Display name for sent emails
  REPLY_TO: "",                   // Leave blank to use your Gmail address
  DAILY_LIMIT: 400,               // Gmail free limit ~500/day; stay safe at 400
  BATCH_SIZE: 50,                 // Emails per run (for time-limited executions)
  DELAY_MS: 200,                  // Milliseconds between sends (rate limiting)
  STATUS_COL: 5,                  // Column E (1-indexed)
  TIMESTAMP_COL: 6,               // Column F
};
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Main function: sends emails to all unsent contacts.
 * Safe to re-run — skips rows already marked "Sent".
 */
function sendBulkEmails() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + CONFIG.SHEET_NAME + '" not found. Please check the SHEET_NAME in CONFIG.');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No contacts found. Please add contacts starting at row 2.");
    return;
  }

  // Check daily quota remaining
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var sentTodayKey = "sentToday_" + today;
  var sentToday = parseInt(props.getProperty(sentTodayKey) || "0");

  if (sentToday >= CONFIG.DAILY_LIMIT) {
    SpreadsheetApp.getUi().alert("Daily email limit of " + CONFIG.DAILY_LIMIT + " reached. Try again tomorrow.");
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var sentCount = 0;
  var failCount = 0;
  var skippedCount = 0;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var name        = String(row[0]).trim();
    var email       = String(row[1]).trim();
    var company     = String(row[2]).trim();
    var customField = String(row[3]).trim();
    var status      = String(row[4]).trim();

    // Skip already-sent or invalid rows
    if (status === "Sent") {
      skippedCount++;
      continue;
    }
    if (!email || !isValidEmail(email)) {
      sheet.getRange(i + 2, CONFIG.STATUS_COL).setValue("Invalid Email");
      continue;
    }

    // Check batch and daily limits
    if (sentCount >= CONFIG.BATCH_SIZE) break;
    if (sentToday + sentCount >= CONFIG.DAILY_LIMIT) {
      Logger.log("Daily limit reached at row " + (i + 2));
      break;
    }

    // Build personalized subject and body
    var subject = personalize(CONFIG.EMAIL_SUBJECT, name, company, customField);
    var body    = personalize(CONFIG.EMAIL_BODY,    name, company, customField);

    try {
      var mailOptions = {
        name: CONFIG.SENDER_NAME,
        htmlBody: plainToHtml(body),
      };
      if (CONFIG.REPLY_TO) mailOptions.replyTo = CONFIG.REPLY_TO;

      GmailApp.sendEmail(email, subject, body, mailOptions);

      // Update status in sheet
      sheet.getRange(i + 2, CONFIG.STATUS_COL).setValue("Sent");
      sheet.getRange(i + 2, CONFIG.TIMESTAMP_COL).setValue(
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
      );
      sentCount++;

      // Rate limiting delay
      if (CONFIG.DELAY_MS > 0) Utilities.sleep(CONFIG.DELAY_MS);

    } catch (e) {
      Logger.log("Failed to send to " + email + ": " + e.message);
      sheet.getRange(i + 2, CONFIG.STATUS_COL).setValue("Failed: " + e.message.substring(0, 80));
      failCount++;
    }
  }

  // Persist daily count
  props.setProperty(sentTodayKey, String(sentToday + sentCount));

  // Flush sheet changes
  SpreadsheetApp.flush();

  var summary = "Done!\n\nSent: " + sentCount + "\nFailed: " + failCount + "\nAlready sent (skipped): " + skippedCount;
  SpreadsheetApp.getUi().alert(summary);
  Logger.log(summary);
}

/**
 * Preview the email for the first unsent contact (no email is actually sent).
 */
function previewEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { SpreadsheetApp.getUi().alert('Sheet not found.'); return; }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('No contacts found.'); return; }

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][4]).trim() !== "Sent") {
      var name = String(data[i][0]).trim();
      var email = String(data[i][1]).trim();
      var company = String(data[i][2]).trim();
      var customField = String(data[i][3]).trim();
      var subject = personalize(CONFIG.EMAIL_SUBJECT, name, company, customField);
      var body    = personalize(CONFIG.EMAIL_BODY,    name, company, customField);
      SpreadsheetApp.getUi().alert("PREVIEW (to: " + email + ")\n\nSUBJECT: " + subject + "\n\n" + body);
      return;
    }
  }
  SpreadsheetApp.getUi().alert("All contacts already sent!");
}

/**
 * Resets "Failed" rows so they will be retried on the next run.
 */
function retryFailed() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var statusRange = sheet.getRange(2, CONFIG.STATUS_COL, lastRow - 1, 1);
  var values = statusRange.getValues();
  var cleared = 0;
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).startsWith("Failed")) {
      values[i][0] = "";
      cleared++;
    }
  }
  statusRange.setValues(values);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("Cleared " + cleared + " failed rows. Run sendBulkEmails() to retry.");
}

/**
 * Creates a time-based trigger to send emails automatically.
 * Call this once; it schedules sendBulkEmails to run every day at 9 AM.
 */
function createDailyTrigger() {
  // Remove existing triggers to avoid duplicates
  deleteTriggers_();
  ScriptApp.newTrigger("sendBulkEmails")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  SpreadsheetApp.getUi().alert("Trigger created: sendBulkEmails will run daily at ~9 AM.");
}

/**
 * Removes all triggers created by this script.
 */
function deleteTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });
}

/**
 * Adds a custom menu to the spreadsheet for easy access.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Email Automation")
    .addItem("Send Bulk Emails", "sendBulkEmails")
    .addItem("Preview Next Email", "previewEmail")
    .addItem("Retry Failed Sends", "retryFailed")
    .addSeparator()
    .addItem("Schedule Daily (9 AM)", "createDailyTrigger")
    .addItem("Remove Schedule", "deleteTriggers_")
    .addToUi();
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Replaces template placeholders with actual contact values.
 * Supports: {{Name}}, {{Company}}, {{CustomField}}
 * Also handles optional blocks: {{#Company}}...{{/Company}}
 */
function personalize(template, name, company, customField) {
  var result = template;
  // Handle optional company block
  if (company) {
    result = result.replace(/\{\{#Company\}\}([\s\S]*?)\{\{\/Company\}\}/g, "$1");
  } else {
    result = result.replace(/\{\{#Company\}\}[\s\S]*?\{\{\/Company\}\}/g, "");
  }
  result = result.replace(/\{\{Name\}\}/g,        name        || "");
  result = result.replace(/\{\{Company\}\}/g,     company     || "");
  result = result.replace(/\{\{CustomField\}\}/g, customField || "");
  return result;
}

/** Converts plain text with newlines to basic HTML. */
function plainToHtml(text) {
  return "<p>" + text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
}

/** Basic email validation. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
