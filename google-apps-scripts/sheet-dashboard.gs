/**
 * Sheet Dashboard Generator — Auto-creates a KPI summary dashboard from raw data.
 *
 * How to use:
 * 1. Have a sheet with your raw data (headers in row 1)
 * 2. Edit DASHBOARD_CONFIG below
 * 3. Run createDashboard()
 */

const DASHBOARD_CONFIG = {
  dataSheet: "Data",
  dashboardSheet: "Dashboard",
  // Column names for KPI calculations
  revenueColumn: "Revenue",
  dateColumn: "Date",
  statusColumn: "Status",
  // Values in Status column to count
  statusValues: ["Complete", "Pending", "Cancelled"],
  // Accent color for dashboard header
  accentColor: "#6366f1",
};

function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(DASHBOARD_CONFIG.dataSheet);
  if (!dataSheet) {
    SpreadsheetApp.getUi().alert(`Data sheet "${DASHBOARD_CONFIG.dataSheet}" not found.`);
    return;
  }

  const data = dataSheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  const rows = data.slice(1).filter(r => r.some(c => c !== ""));

  // Calculate KPIs
  const revenueIdx = headers.indexOf(DASHBOARD_CONFIG.revenueColumn);
  const statusIdx = headers.indexOf(DASHBOARD_CONFIG.statusColumn);
  const dateIdx = headers.indexOf(DASHBOARD_CONFIG.dateColumn);

  const totalRevenue = revenueIdx !== -1
    ? rows.reduce((s, r) => s + (Number(r[revenueIdx]) || 0), 0) : 0;
  const avgRevenue = rows.length > 0 ? totalRevenue / rows.length : 0;
  const maxRevenue = revenueIdx !== -1
    ? Math.max(...rows.map(r => Number(r[revenueIdx]) || 0)) : 0;

  const statusCounts = {};
  if (statusIdx !== -1) {
    rows.forEach(r => {
      const val = r[statusIdx] || "Unknown";
      statusCounts[val] = (statusCounts[val] || 0) + 1;
    });
  }

  // Get or create dashboard sheet
  let dash = ss.getSheetByName(DASHBOARD_CONFIG.dashboardSheet);
  if (dash) dash.clearContents(); else dash = ss.insertSheet(DASHBOARD_CONFIG.dashboardSheet);
  dash.setTabColor(DASHBOARD_CONFIG.accentColor);

  // Title
  dash.getRange("A1:F1").merge()
    .setValue("📊 Dashboard")
    .setFontSize(20).setFontWeight("bold")
    .setBackground(DASHBOARD_CONFIG.accentColor).setFontColor("#ffffff")
    .setHorizontalAlignment("center");
  dash.setRowHeight(1, 50);

  dash.getRange("A2:F2").merge()
    .setValue(`Last updated: ${new Date().toLocaleString()}`)
    .setFontColor("#666666").setHorizontalAlignment("center").setFontSize(10);

  // KPI cards row
  const kpiLabels = ["Total Records", "Total Revenue", "Avg Revenue", "Max Revenue", "Data Columns"];
  const kpiValues = [
    rows.length,
    `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    `$${avgRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    `$${maxRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    headers.length,
  ];

  kpiLabels.forEach((label, i) => {
    const col = i + 1;
    dash.getRange(4, col).setValue(label).setFontWeight("bold").setFontColor("#666666").setFontSize(10);
    dash.getRange(5, col).setValue(kpiValues[i]).setFontSize(16).setFontWeight("bold");
    dash.setColumnWidth(col, 130);
  });

  // Status breakdown table
  if (Object.keys(statusCounts).length > 0) {
    dash.getRange("A7").setValue("Status Breakdown").setFontWeight("bold").setFontSize(13);
    dash.getRange("A8:B8").setValues([["Status", "Count"]]).setFontWeight("bold")
      .setBackground("#f0f0f0");
    const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
    statusEntries.forEach(([status, count], i) => {
      dash.getRange(9 + i, 1).setValue(status);
      dash.getRange(9 + i, 2).setValue(count);
    });

    // Add a chart
    const chartRange = dash.getRange(8, 1, statusEntries.length + 1, 2);
    const chart = dash.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(chartRange)
      .setPosition(7, 3, 0, 0)
      .setOption("title", "Status Distribution")
      .setOption("width", 400)
      .setOption("height", 250)
      .build();
    dash.insertChart(chart);
  }

  // Revenue chart if data exists
  if (dateIdx !== -1 && revenueIdx !== -1 && rows.length > 1) {
    const chartData = [["Date", "Revenue"]];
    rows.slice(0, 20).forEach(r => {
      if (r[dateIdx] && r[revenueIdx]) chartData.push([r[dateIdx], Number(r[revenueIdx]) || 0]);
    });
    if (chartData.length > 1) {
      const tempSheet = ss.insertSheet("_chart_temp");
      tempSheet.getRange(1, 1, chartData.length, 2).setValues(chartData);
      const revenueChart = dash.newChart()
        .setChartType(Charts.ChartType.LINE)
        .addRange(tempSheet.getRange(1, 1, chartData.length, 2))
        .setPosition(15, 1, 0, 0)
        .setOption("title", "Revenue Over Time")
        .setOption("width", 600)
        .setOption("height", 300)
        .build();
      dash.insertChart(revenueChart);
      ss.deleteSheet(tempSheet);
    }
  }

  ss.setActiveSheet(dash);
  SpreadsheetApp.getUi().alert("Dashboard created successfully!");
}
