// =====================================================
// CHIPS INCOME TRACKER - GOOGLE APPS SCRIPT BACKEND
// =====================================================
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Create a new project
// 3. Copy-paste this entire code
// 4. Click "Deploy" > "New deployment"
// 5. Select "Web app"
// 6. Set "Execute as" to "Me"
// 7. Set "Who has access" to "Anyone"
// 8. Click "Deploy" and copy the Web App URL
// 9. Paste the URL in the web app settings
//
// =====================================================

// Configuration - Update this with your Spreadsheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual spreadsheet ID

// Sheet names
const SHEETS = {
  INCOME_TRACKER: 'Income Tracker',
  WEEKLY_SUMMARY: 'Weekly Summary',
  SITE_FUND: 'Site Fund 35%',
  RETAINED: 'Retained 20%',
  SAVINGS: 'Savings 15%'
};

// =====================================================
// MAIN HANDLERS
// =====================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const action = e.parameter.action || 'getData';
    let result;
    
    switch(action) {
      case 'getData':
        result = getAllData();
        break;
      case 'getIncomeData':
        result = getIncomeData();
        break;
      case 'getWeeklyData':
        result = getWeeklyData();
        break;
      case 'getSiteFundData':
        result = getSiteFundData();
        break;
      case 'getRetainedData':
        result = getRetainedData();
        break;
      case 'getSavingsData':
        result = getSavingsData();
        break;
      case 'addIncomeEntry':
        result = addIncomeEntry(JSON.parse(e.parameter.data));
        break;
      case 'updateIncomeEntry':
        result = updateIncomeEntry(JSON.parse(e.parameter.data));
        break;
      case 'deleteIncomeEntry':
        result = deleteIncomeEntry(e.parameter.rowIndex);
        break;
      case 'addWeeklySummary':
        result = addWeeklySummary(JSON.parse(e.parameter.data));
        break;
      case 'updateWeeklySummary':
        result = updateWeeklySummary(JSON.parse(e.parameter.data));
        break;
      case 'addExpense':
        result = addExpense(e.parameter.sheetName, JSON.parse(e.parameter.data));
        break;
      case 'getLastNetChips':
        result = getLastNetChips();
        break;
      case 'calculateWeeklySummary':
        result = calculateWeeklySummary(e.parameter.startDate, e.parameter.endDate);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    output.setContent(JSON.stringify(result));
  } catch (error) {
    output.setContent(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    }));
  }
  
  return output;
}

// =====================================================
// GET DATA FUNCTIONS
// =====================================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getAllData() {
  return {
    success: true,
    data: {
      income: getIncomeData(),
      weekly: getWeeklyData(),
      siteFund: getSiteFundData(),
      retained: getRetainedData(),
      savings: getSavingsData(),
      lastNetChips: getLastNetChips()
    },
    timestamp: new Date().toISOString()
  };
}

function getIncomeData() {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header row
  
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip empty rows
    
    result.push({
      rowIndex: i + 1,
      date: formatDateForOutput(row[0]),
      shiftTime: row[1] || '',
      cfr: parseFloat(row[2]) || 0,
      agentCommission: parseFloat(row[3]) || 0,
      loaderSalary: parseFloat(row[4]) || 0,
      otherExpenses: parseFloat(row[5]) || 0,
      otherExpensesList: row[6] || '', // JSON string of list
      netIncome: parseFloat(row[7]) || 0,
      chipsIn: parseFloat(row[8]) || 0,
      chipsInList: row[9] || '', // JSON string of list
      chipsOut: parseFloat(row[10]) || 0,
      netChips: parseFloat(row[11]) || 0,
      totalChipsRemaining: parseFloat(row[12]) || 0
    });
  }
  
  return result;
}

function getWeeklyData() {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.WEEKLY_SUMMARY);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    
    result.push({
      rowIndex: i + 1,
      start: formatDateForOutput(row[0]),
      end: formatDateForOutput(row[1]),
      ggr: parseFloat(row[2]) || 0,
      agentCommissions: parseFloat(row[3]) || 0,
      loaderSalary: parseFloat(row[4]) || 0,
      otherExpenses: parseFloat(row[5]) || 0,
      netProfit: parseFloat(row[6]) || 0,
      chipsOut: parseFloat(row[7]) || 0,
      totalChipsRemaining: parseFloat(row[8]) || 0,
      roi: parseFloat(row[9]) || 0,
      status: row[10] || '',
      distributed80: parseFloat(row[11]) || 0,
      team50: parseFloat(row[12]) || 0,
      siteFund35: parseFloat(row[13]) || 0,
      savings15: parseFloat(row[14]) || 0
    });
  }
  
  return result;
}

function getSiteFundData() {
  return getFundData(SHEETS.SITE_FUND);
}

function getRetainedData() {
  return getFundData(SHEETS.RETAINED);
}

function getSavingsData() {
  return getFundData(SHEETS.SAVINGS);
}

function getFundData(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    
    result.push({
      rowIndex: i + 1,
      start: formatDateForOutput(row[0]),
      end: formatDateForOutput(row[1]),
      sourceAmount: parseFloat(row[2]) || 0, // Distributed 80% or Net Profit
      allocated: parseFloat(row[3]) || 0, // Site Fund 35%, Retained 20%, or Savings 15%
      spent: parseFloat(row[4]) || 0,
      spentList: row[5] || '', // JSON string of expenses
      remaining: parseFloat(row[6]) || 0
    });
  }
  
  return result;
}

function getLastNetChips() {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) return 0;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  
  // Find last non-empty row
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && data[i][11]) {
      return parseFloat(data[i][11]) || 0;
    }
  }
  
  return 0;
}

// =====================================================
// ADD/UPDATE DATA FUNCTIONS
// =====================================================

function addIncomeEntry(data) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  // Calculate derived values
  const otherExpensesTotal = calculateTotalFromList(data.otherExpensesList);
  const netIncome = data.cfr - data.agentCommission - data.loaderSalary - otherExpensesTotal;
  
  const chipsInTotal = calculateTotalFromList(data.chipsInList);
  const netChips = chipsInTotal - data.chipsOut;
  const totalChipsRemaining = netChips;
  
  const row = [
    new Date(data.date),
    data.shiftTime,
    data.cfr,
    data.agentCommission,
    data.loaderSalary,
    otherExpensesTotal,
    JSON.stringify(data.otherExpensesList || []),
    netIncome,
    chipsInTotal,
    JSON.stringify(data.chipsInList || []),
    data.chipsOut,
    netChips,
    totalChipsRemaining
  ];
  
  sheet.appendRow(row);
  
  return { 
    success: true, 
    message: 'Income entry added successfully',
    data: {
      netIncome: netIncome,
      netChips: netChips,
      totalChipsRemaining: totalChipsRemaining
    }
  };
}

function updateIncomeEntry(data) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  const rowIndex = data.rowIndex;
  
  // Calculate derived values
  const otherExpensesTotal = calculateTotalFromList(data.otherExpensesList);
  const netIncome = data.cfr - data.agentCommission - data.loaderSalary - otherExpensesTotal;
  
  const chipsInTotal = calculateTotalFromList(data.chipsInList);
  const netChips = chipsInTotal - data.chipsOut;
  const totalChipsRemaining = netChips;
  
  const row = [
    new Date(data.date),
    data.shiftTime,
    data.cfr,
    data.agentCommission,
    data.loaderSalary,
    otherExpensesTotal,
    JSON.stringify(data.otherExpensesList || []),
    netIncome,
    chipsInTotal,
    JSON.stringify(data.chipsInList || []),
    data.chipsOut,
    netChips,
    totalChipsRemaining
  ];
  
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  
  return { 
    success: true, 
    message: 'Income entry updated successfully',
    data: {
      netIncome: netIncome,
      netChips: netChips,
      totalChipsRemaining: totalChipsRemaining
    }
  };
}

function deleteIncomeEntry(rowIndex) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  sheet.deleteRow(parseInt(rowIndex));
  
  return { success: true, message: 'Entry deleted successfully' };
}

function addWeeklySummary(data) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.WEEKLY_SUMMARY);
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  // Calculate values from income tracker for this date range
  const calculated = calculateWeeklySummary(data.start, data.end);
  
  // Calculate derived values
  const netProfit = data.ggr - calculated.agentCommissions - calculated.loaderSalary - calculated.otherExpenses;
  const roi = data.ggr > 0 ? (netProfit / data.ggr) : 0;
  const status = netProfit >= 0 ? 'Profit' : 'Loss';
  const distributed80 = netProfit * 0.80;
  const team50 = netProfit * 0.50;
  const siteFund35 = netProfit * 0.35;
  const savings15 = netProfit * 0.15;
  
  const row = [
    new Date(data.start),
    new Date(data.end),
    data.ggr,
    calculated.agentCommissions,
    calculated.loaderSalary,
    calculated.otherExpenses,
    netProfit,
    calculated.chipsOut,
    calculated.totalChipsRemaining,
    roi,
    status,
    distributed80,
    team50,
    siteFund35,
    savings15
  ];
  
  sheet.appendRow(row);
  
  // Also add entries to fund sheets
  addFundEntry(SHEETS.SITE_FUND, data.start, data.end, distributed80, siteFund35);
  addFundEntry(SHEETS.RETAINED, data.start, data.end, netProfit, netProfit * 0.20);
  addFundEntry(SHEETS.SAVINGS, data.start, data.end, distributed80, savings15);
  
  return { 
    success: true, 
    message: 'Weekly summary added successfully',
    data: {
      netProfit: netProfit,
      roi: roi,
      status: status,
      distributed80: distributed80,
      team50: team50,
      siteFund35: siteFund35,
      savings15: savings15
    }
  };
}

function updateWeeklySummary(data) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.WEEKLY_SUMMARY);
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  const rowIndex = data.rowIndex;
  
  // Calculate derived values
  const netProfit = data.ggr - data.agentCommissions - data.loaderSalary - data.otherExpenses;
  const roi = data.ggr > 0 ? (netProfit / data.ggr) : 0;
  const status = netProfit >= 0 ? 'Profit' : 'Loss';
  const distributed80 = netProfit * 0.80;
  const team50 = netProfit * 0.50;
  const siteFund35 = netProfit * 0.35;
  const savings15 = netProfit * 0.15;
  
  const row = [
    new Date(data.start),
    new Date(data.end),
    data.ggr,
    data.agentCommissions,
    data.loaderSalary,
    data.otherExpenses,
    netProfit,
    data.chipsOut,
    data.totalChipsRemaining,
    roi,
    status,
    distributed80,
    team50,
    siteFund35,
    savings15
  ];
  
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  
  return { 
    success: true, 
    message: 'Weekly summary updated successfully'
  };
}

function addFundEntry(sheetName, start, end, sourceAmount, allocated) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  
  const row = [
    new Date(start),
    new Date(end),
    sourceAmount,
    allocated,
    0, // spent
    '[]', // spentList
    allocated // remaining
  ];
  
  sheet.appendRow(row);
}

function addExpense(sheetName, data) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  const rowIndex = data.rowIndex;
  const currentData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  
  // Parse existing expenses
  let spentList = [];
  try {
    spentList = JSON.parse(currentData[5] || '[]');
  } catch(e) {
    spentList = [];
  }
  
  // Add new expense
  spentList.push({
    amount: data.amount,
    remarks: data.remarks,
    date: new Date().toISOString()
  });
  
  // Calculate new totals
  const totalSpent = spentList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const remaining = (parseFloat(currentData[3]) || 0) - totalSpent;
  
  // Update the row
  sheet.getRange(rowIndex, 5, 1, 3).setValues([[totalSpent, JSON.stringify(spentList), remaining]]);
  
  return { 
    success: true, 
    message: 'Expense added successfully',
    data: {
      totalSpent: totalSpent,
      remaining: remaining
    }
  };
}

function calculateWeeklySummary(startDate, endDate) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) {
    return {
      agentCommissions: 0,
      loaderSalary: 0,
      otherExpenses: 0,
      chipsOut: 0,
      totalChipsRemaining: 0
    };
  }
  
  const data = sheet.getDataRange().getValues();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59); // Include the entire end day
  
  let agentCommissions = 0;
  let loaderSalary = 0;
  let otherExpenses = 0;
  let chipsOut = 0;
  let totalChipsRemaining = 0;
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = new Date(data[i][0]);
    if (rowDate >= start && rowDate <= end) {
      agentCommissions += parseFloat(data[i][3]) || 0;
      loaderSalary += parseFloat(data[i][4]) || 0;
      otherExpenses += parseFloat(data[i][5]) || 0;
      chipsOut += parseFloat(data[i][10]) || 0;
      totalChipsRemaining = parseFloat(data[i][12]) || 0;
    }
  }
  
  return {
    agentCommissions: agentCommissions,
    loaderSalary: loaderSalary,
    otherExpenses: otherExpenses,
    chipsOut: chipsOut,
    totalChipsRemaining: totalChipsRemaining
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateTotalFromList(list) {
  if (!list || !Array.isArray(list)) return 0;
  return list.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
}

function formatDateForOutput(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
}

// =====================================================
// INITIALIZATION FUNCTION
// =====================================================

function initializeSheets() {
  const ss = getSpreadsheet();
  
  // Create Income Tracker sheet if not exists
  let sheet = ss.getSheetByName(SHEETS.INCOME_TRACKER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.INCOME_TRACKER);
    sheet.getRange(1, 1, 1, 13).setValues([[
      'Date', 'Shift Time', 'CFR', 'Agent Commission', 'Loader Salary',
      'Other Expenses', 'Other Expenses List', 'Net Income', 'Chips In',
      'Chips In List', 'Chips Out', 'Net Chips', 'Total Chips Remaining'
    ]]);
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
  }
  
  // Create Weekly Summary sheet if not exists
  sheet = ss.getSheetByName(SHEETS.WEEKLY_SUMMARY);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.WEEKLY_SUMMARY);
    sheet.getRange(1, 1, 1, 15).setValues([[
      'Start', 'End', 'GGR', 'Agent Commissions', 'Loader Salary',
      'Other Expenses', 'Net Profit', 'Chips Out', 'Total Chips Remaining',
      'ROI', 'Status', 'Distributed 80%', 'Team 50%', 'Site Fund 35%', 'Savings 15%'
    ]]);
    sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
  }
  
  // Create Site Fund sheet if not exists
  sheet = ss.getSheetByName(SHEETS.SITE_FUND);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.SITE_FUND);
    sheet.getRange(1, 1, 1, 7).setValues([[
      'Start', 'End', 'Distributed 80%', 'Site Fund 35%', 'Spent', 'Spent List', 'Remaining'
    ]]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  
  // Create Retained sheet if not exists
  sheet = ss.getSheetByName(SHEETS.RETAINED);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.RETAINED);
    sheet.getRange(1, 1, 1, 7).setValues([[
      'Start', 'End', 'Net Profit', 'Retained 20%', 'Spent', 'Spent List', 'Remaining'
    ]]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  
  // Create Savings sheet if not exists
  sheet = ss.getSheetByName(SHEETS.SAVINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.SAVINGS);
    sheet.getRange(1, 1, 1, 7).setValues([[
      'Start', 'End', 'Distributed 80%', 'Savings 15%', 'Spent', 'Spent List', 'Remaining'
    ]]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  
  return { success: true, message: 'All sheets initialized successfully' };
}

// Run this function once to set up your spreadsheet
function setup() {
  initializeSheets();
  Logger.log('Setup complete!');
}
