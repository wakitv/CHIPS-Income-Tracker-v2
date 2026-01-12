# 🎰 CHIPS Income Tracker v2

A Progressive Web App (PWA) for tracking online casino income with **real-time Google Sheets integration** using Google Apps Script.

![Version](https://img.shields.io/badge/version-2.0-gold)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20iOS%20%7C%20Android-blue)

## ✨ Features

### 📊 5 Main Tabs

1. **Income Tracker** - Daily shift-based income tracking
   - 3 shift options (12PM-8PM, 8PM-4AM, 4AM-12PM)
   - CFR (Cash For Remittance) input
   - Agent Commission & Loader Salary
   - Multiple Other Expenses with remarks
   - Multiple Chips In with auto-fill from last Net Chips
   - Auto-calculated Net Income & Net Chips

2. **Weekly Summary** - Weekly cutoff performance
   - Date range (Start - End)
   - GGR (Gross Gaming Revenue) input
   - Auto-calculated: Net Profit, ROI%, Status
   - Distribution breakdown (80%, 50%, 35%, 15%)

3. **Site Fund 35%** - Track site fund allocation
   - Shows Distributed 80% and Site Fund 35%
   - Add expenses with remarks
   - Track remaining balance

4. **Retained 20%** - Bills & utilities tracking
   - Shows Net Profit and Retained 20%
   - Add expenses for bills/utilities
   - Track remaining balance

5. **Savings 15%** - Savings allocation
   - Shows Distributed 80% and Savings 15%
   - Track withdrawals
   - Monitor savings balance

### 🔥 Key Features

- ✅ **Real-time sync** with Google Sheets
- ✅ **Full CRUD operations** (Create, Read, Update, Delete)
- ✅ **Offline support** - works without internet
- ✅ **PWA installable** - add to home screen
- ✅ **Mobile-first design** - optimized for phones
- ✅ **Auto-calculations** - all formulas built-in
- ✅ **Dark casino theme** - easy on the eyes
- ✅ **Demo mode** - works without Google Sheets setup

---

## 🚀 Setup Instructions

### Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 2: Setup Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Delete any existing code
4. Copy the entire content from `google-apps-script/Code.gs`
5. Paste it into the editor
6. **Replace** `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = 'your-actual-spreadsheet-id-here';
   ```

### Step 3: Initialize Sheets

1. In the Apps Script editor, select `setup` function from dropdown
2. Click **Run** ▶️
3. Grant permissions when prompted
4. This creates all required sheets with proper headers

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Configure:
   - **Description**: CHIPS API v2
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

### Step 5: Configure the App

1. Open the CHIPS Tracker app
2. Click **Settings** ⚙️
3. Paste the **Web App URL**
4. Click **Test Connection**
5. If successful, click **Save Settings**

---

## 📱 Installation (PWA)

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **⋮** menu
3. Select **"Add to Home Screen"**
4. Tap **Add**

### iOS (Safari)
1. Open the app in Safari
2. Tap the **Share** button
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add**

### Desktop (Chrome/Edge)
1. Open the app
2. Click the **install icon** in the address bar
3. Click **Install**

---

## 🖥️ Deployment Options

### Option 1: GitHub Pages (Free)

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit - CHIPS v2"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/chips-tracker-v2.git
git branch -M main
git push -u origin main
```

Then enable GitHub Pages:
1. Go to repository **Settings**
2. Navigate to **Pages**
3. Source: **Deploy from branch**
4. Branch: **main** / **root**
5. Click **Save**

Your app will be live at: `https://YOUR_USERNAME.github.io/chips-tracker-v2/`

### Option 2: Netlify (Free)

1. Go to [Netlify](https://netlify.com)
2. Drag and drop the project folder
3. Done! You get a URL like `https://random-name.netlify.app`

### Option 3: Vercel (Free)

```bash
npm i -g vercel
vercel
```

---

## 📁 Project Structure

```
chips-tracker-v2/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── styles.css          # All styles
├── js/
│   ├── config.js           # Configuration
│   ├── api.js              # Google Apps Script API
│   └── app.js              # Main application
├── assets/
│   ├── icon-192.png        # App icon (small)
│   └── icon-512.png        # App icon (large)
├── google-apps-script/
│   └── Code.gs             # Google Apps Script code
└── README.md               # This file
```

---

## 📊 Google Sheets Structure

The app creates these sheets automatically:

### Income Tracker
| Date | Shift Time | CFR | Agent Commission | Loader Salary | Other Expenses | Other Expenses List | Net Income | Chips In | Chips In List | Chips Out | Net Chips | Total Chips Remaining |

### Weekly Summary
| Start | End | GGR | Agent Commissions | Loader Salary | Other Expenses | Net Profit | Chips Out | Total Chips Remaining | ROI | Status | Distributed 80% | Team 50% | Site Fund 35% | Savings 15% |

### Site Fund 35%
| Start | End | Distributed 80% | Site Fund 35% | Spent | Spent List | Remaining |

### Retained 20%
| Start | End | Net Profit | Retained 20% | Spent | Spent List | Remaining |

### Savings 15%
| Start | End | Distributed 80% | Savings 15% | Spent | Spent List | Remaining |

---

## 🔧 Customization

### Change Currency Symbol
Edit `js/config.js`:
```javascript
CURRENCY: '$', // Change from ₱ to $
```

### Change Auto-Sync Interval
Edit `js/config.js`:
```javascript
AUTO_SYNC_INTERVAL: 60000, // Change to 60 seconds
```

### Change Theme Colors
Edit `css/styles.css`:
```css
:root {
    --gold: #ffd700;      /* Main accent color */
    --green: #00ff88;     /* Profit color */
    --red: #ff4757;       /* Loss color */
}
```

---

## ⚠️ Troubleshooting

### "Connection Failed" Error
1. Make sure the Web App URL is correct
2. Check that you deployed with "Anyone" access
3. Try redeploying the Apps Script

### Data Not Syncing
1. Check internet connection
2. Click the refresh button
3. Check browser console for errors

### "Sheet not found" Error
1. Run the `setup()` function in Apps Script
2. Make sure sheet names match exactly

### PWA Not Installing
1. Must be served over HTTPS
2. Clear browser cache
3. Check manifest.json is accessible

---

## 📝 API Reference

### Available Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `getData` | Get all data | - |
| `getIncomeData` | Get income entries | - |
| `getWeeklyData` | Get weekly summaries | - |
| `addIncomeEntry` | Add new income | `data` (JSON) |
| `updateIncomeEntry` | Update income | `data` (JSON) |
| `deleteIncomeEntry` | Delete income | `rowIndex` |
| `addWeeklySummary` | Add weekly cutoff | `data` (JSON) |
| `addExpense` | Add expense to fund | `sheetName`, `data` |
| `calculateWeeklySummary` | Calculate from dates | `startDate`, `endDate` |

---

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section
2. Look at browser console (F12) for errors
3. Verify Google Apps Script logs

---

## 📜 License

MIT License - Feel free to use and modify!

---

Made with ❤️ for Filipino casino operators
