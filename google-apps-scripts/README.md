# Google Apps Script Macros — Delivery Package

Thank you for your purchase! These scripts automate common Google Sheets / Google Workspace tasks. No coding experience needed to use them.

---

## How to Install Any Script

1. Open your Google Spreadsheet
2. Click **Extensions → Apps Script**
3. Delete any existing code in the editor
4. Paste the script contents
5. Click **Save** (disk icon)
6. Click **Run** → authorize when prompted

---

## Scripts Included

### 1. `email-automation.gs` — Bulk Personalized Email Sender

Reads a contacts sheet and sends personalized emails via Gmail.

**Sheet format required:**
| Name | Email | Company | Custom1 |
|---|---|---|---|

**What it does:**
- Sends personalized emails to every row
- Tracks sent status back to the sheet (won't resend)
- Respects Gmail daily limits (rate-limited)
- Supports HTML email templates

**Run:** `sendBulkEmails()`

---

### 2. `data-aggregator.gs` — Multi-Sheet Data Combiner

Combines data from multiple tabs into one master sheet.

**What it does:**
- Pulls all data from specified source sheets
- Removes duplicate rows
- Sorts by date or any column
- Adds summary statistics row
- Can run automatically on a daily schedule

**Configure:** Edit the `CONFIG` object at the top of the file
**Run:** `aggregateData()`

---

### 3. `invoice-generator.gs` — Automatic Invoice Creator

Generates professional Google Docs invoices from a client spreadsheet.

**Sheet format required:**
| Client Name | Email | Service | Amount | Due Date | Status |
|---|---|---|---|---|---|

**What it does:**
- Creates a formatted invoice Doc for each client row
- Saves invoices to a Google Drive folder
- Optionally emails invoices as PDF attachments
- Marks rows as "Sent" to prevent duplicates

**Run:** `generateInvoices()`

---

### 4. `sheet-dashboard.gs` — Auto Dashboard Generator

Creates a visual KPI dashboard from your raw data.

**What it does:**
- Calculates totals, averages, and max values
- Shows status breakdowns in a table
- Generates pie and line charts automatically
- One-click refresh anytime

**Configure:** Edit `DASHBOARD_CONFIG` at the top
**Run:** `createDashboard()`

---

## Setting Up Automatic Runs (Triggers)

To run any script on a schedule:
1. In Apps Script, click **Triggers** (clock icon on left sidebar)
2. Click **+ Add Trigger**
3. Choose your function, frequency (hourly/daily/weekly)
4. Click Save

---

## Support

Reach out via Fiverr within 7 days for configuration help or customization.
