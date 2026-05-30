/**
 * Invoice Generator — Auto-generates Google Docs invoices from a spreadsheet.
 *
 * Sheet format (Row 1 = headers):
 *   Client Name | Email | Service | Amount | Due Date | Status
 *
 * How to use:
 * 1. Create a sheet named "Clients" with the columns above
 * 2. Create a Google Doc template (or use the built-in template below)
 * 3. Set TEMPLATE_DOC_ID to your template doc's ID (from its URL)
 * 4. Run generateInvoices()
 */

const INVOICE_CONFIG = {
  clientSheet: "Clients",
  invoiceFolder: "Invoices",      // Google Drive folder name (created if needed)
  templateDocId: "",              // Optional: your Doc template ID. Leave empty for built-in.
  senderName: "Your Business Name",
  senderEmail: "you@yourbusiness.com",
  senderAddress: "123 Main St, City, State 12345",
  currency: "USD",
  emailInvoices: false,           // Set true to email each client their invoice
  statusColumnName: "Status",     // Column to mark as "Sent" after generation
};

function generateInvoices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(INVOICE_CONFIG.clientSheet);
  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${INVOICE_CONFIG.clientSheet}" not found.`);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  const rows = data.slice(1);

  // Find or create output folder
  let folder;
  const folders = DriveApp.getFoldersByName(INVOICE_CONFIG.invoiceFolder);
  folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(INVOICE_CONFIG.invoiceFolder);

  let generated = 0;
  const statusCol = headers.indexOf(INVOICE_CONFIG.statusColumnName);

  rows.forEach((row, i) => {
    // Skip already processed
    if (statusCol !== -1 && row[statusCol] === "Sent") return;

    const client = {
      name: row[headers.indexOf("Client Name")] || "",
      email: row[headers.indexOf("Email")] || "",
      service: row[headers.indexOf("Service")] || "",
      amount: row[headers.indexOf("Amount")] || 0,
      dueDate: row[headers.indexOf("Due Date")] || "",
    };

    if (!client.name) return;

    const invoiceNum = `INV-${new Date().getFullYear()}-${String(i + 1).padStart(3, "0")}`;
    const doc = createInvoiceDoc(client, invoiceNum, folder);

    if (INVOICE_CONFIG.emailInvoices && client.email) {
      const pdf = doc.getAs("application/pdf");
      GmailApp.sendEmail(client.email, `Invoice ${invoiceNum} from ${INVOICE_CONFIG.senderName}`,
        `Dear ${client.name},\n\nPlease find your invoice attached.\n\nAmount due: $${client.amount}\nDue date: ${client.dueDate}\n\nThank you,\n${INVOICE_CONFIG.senderName}`,
        { attachments: [pdf], name: INVOICE_CONFIG.senderName }
      );
    }

    // Mark as sent
    if (statusCol !== -1) {
      sheet.getRange(i + 2, statusCol + 1).setValue("Sent");
    }
    generated++;
  });

  SpreadsheetApp.getUi().alert(`Generated ${generated} invoice(s) in Google Drive folder "${INVOICE_CONFIG.invoiceFolder}".`);
}

function createInvoiceDoc(client, invoiceNum, folder) {
  const docName = `${invoiceNum} — ${client.name}`;
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  body.clear();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(54).setMarginRight(54);

  // Header
  const header = body.appendParagraph(INVOICE_CONFIG.senderName);
  header.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  header.setSpacingAfter(4);

  body.appendParagraph(INVOICE_CONFIG.senderAddress).setSpacingAfter(2);
  body.appendParagraph(INVOICE_CONFIG.senderEmail).setSpacingAfter(20);

  // Invoice meta
  body.appendParagraph(`Invoice #: ${invoiceNum}`).setBold(true);
  body.appendParagraph(`Date: ${new Date().toLocaleDateString()}`);
  body.appendParagraph(`Due Date: ${client.dueDate || "Upon receipt"}`).setSpacingAfter(20);

  // Bill to
  body.appendParagraph("BILL TO:").setBold(true).setSpacingAfter(4);
  body.appendParagraph(client.name);
  if (client.email) body.appendParagraph(client.email);
  body.appendParagraph("").setSpacingAfter(10);

  // Service table
  const table = body.appendTable([
    ["Description", "Amount"],
    [client.service || "Professional Services", `$${Number(client.amount).toFixed(2)}`],
    ["", ""],
    ["TOTAL DUE", `$${Number(client.amount).toFixed(2)}`],
  ]);
  table.getRow(0).editAsText().setBold(true);
  table.getRow(3).editAsText().setBold(true);

  body.appendParagraph("").setSpacingAfter(20);
  body.appendParagraph("Thank you for your business!").setItalic(true);

  doc.saveAndClose();

  // Move to folder
  const file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return doc;
}
