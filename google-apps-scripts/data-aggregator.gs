/**
 * Data Aggregator — Combines multiple sheets into one master sheet.
 *
 * How to use:
 * 1. Open your Google Spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire file
 * 4. Edit CONFIG below to match your sheet names
 * 5. Run aggregateData() or set up a trigger
 */

const CONFIG = {
  // Names of sheets to pull data from (must have same column headers)
  sourceSheets: ["January", "February", "March"],
  // Name of the output sheet (will be created if it doesn't exist)
  masterSheet: "Master",
  // Column name to sort by (e.g., "Date"). Leave empty to skip sorting.
  sortByColumn: "Date",
  sortAscending: true,
  // Remove duplicate rows? (true/false)
  removeDuplicates: true,
  // Add a summary statistics row at the bottom?
  addSummary: true,
};

function aggregateData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Get or create master sheet
  let master = ss.getSheetByName(CONFIG.masterSheet);
  if (master) {
    master.clearContents();
  } else {
    master = ss.insertSheet(CONFIG.masterSheet);
  }

  let headers = null;
  const allRows = [];

  for (const name of CONFIG.sourceSheets) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) {
      Logger.log(`Sheet not found: ${name}, skipping.`);
      continue;
    }
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    if (!headers) {
      headers = data[0];
    }
    // Skip header row from source sheets
    for (let i = 1; i < data.length; i++) {
      if (data[i].some(cell => cell !== "")) {
        allRows.push(data[i]);
      }
    }
  }

  if (!headers) {
    ui.alert("No data found in source sheets.");
    return;
  }

  // Remove duplicates
  let rows = allRows;
  if (CONFIG.removeDuplicates) {
    const seen = new Set();
    rows = allRows.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    Logger.log(`Removed ${allRows.length - rows.length} duplicate rows.`);
  }

  // Sort by column
  if (CONFIG.sortByColumn && rows.length > 0) {
    const colIdx = headers.indexOf(CONFIG.sortByColumn);
    if (colIdx !== -1) {
      rows.sort((a, b) => {
        const av = a[colIdx], bv = b[colIdx];
        if (av < bv) return CONFIG.sortAscending ? -1 : 1;
        if (av > bv) return CONFIG.sortAscending ? 1 : -1;
        return 0;
      });
    }
  }

  // Write to master sheet
  master.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold")
    .setBackground("#1a1a2e")
    .setFontColor("#ffffff");

  if (rows.length > 0) {
    master.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Summary row
  if (CONFIG.addSummary && rows.length > 0) {
    const summaryRow = headers.map((header, i) => {
      if (i === 0) return `TOTAL (${rows.length} rows)`;
      const colVals = rows.map(r => r[i]).filter(v => typeof v === "number");
      if (colVals.length > 0) {
        return colVals.reduce((s, v) => s + v, 0);
      }
      return "";
    });
    const summaryRange = master.getRange(rows.length + 2, 1, 1, headers.length);
    summaryRange.setValues([summaryRow])
      .setFontWeight("bold")
      .setBackground("#f0f0f0");
  }

  master.autoResizeColumns(1, headers.length);
  Logger.log(`Aggregated ${rows.length} rows into "${CONFIG.masterSheet}".`);
  ui.alert(`Done! ${rows.length} rows aggregated into "${CONFIG.masterSheet}".`);
}

// Optional: run aggregation daily via trigger
function createDailyTrigger() {
  ScriptApp.newTrigger("aggregateData")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  SpreadsheetApp.getUi().alert("Daily trigger created — will run at 8am every day.");
}
