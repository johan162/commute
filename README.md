# Commute Time Tracker PWA

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.6.1-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)
![Bundle Size](https://img.shields.io/bundlephobia/min/commute)

A simple and efficient Progressive Web App (PWA) to track your commute time to work. It provides detailed statistics and visualizations to help you understand your travel patterns.

## Features

- **Basic Statistics:** Get detailed insights into your commute times, including average, best, and worst travel times.
- **Advance Statistics:** Trend analysis (Mann-Kendall), pattern analysis (Runs Test) and normality test (Shapiro-Wilk) to give insights in commute patterns.
- **History View:** Browse a complete history of your commutes to identify trends and patterns.
- **Geo-Fencing:** The app can automatically stop tracking when you arrive at your work destination, so you don't have to remember to do it manually.
- **PDF Report**: Professional loooking PDF summary report.
- **Data export**: Export data for offline processing in CSV format.
- **Progressive Web App:** Installable on any phone or tablet, providing a native app-like experience.
- **Data Privacy:** Data is only stored locally. No telemetry!


## User Quick Start 

**Note on privacy:** Again, data is **ONLY** stored locally in the browser/App. No remote data is saved! 

**Step 1:** Open URL: [https://johan162.github.io/commute](https://johan162.github.io/commute)

**Step 2:** To install this as an offline App do the following depending on OS:

### Android:
- Click the extended menu (three vertical dots)
- Select "Add to home screen"
- In the popup shown choose "Install as App"

### iOS:
- Click the share-icon (top-right corner of browser)
- Scroll down and select "Add to Home Screen"

### Desktop Chrome
- Clicke the extended menu (three vertical dots)
- Select "Cast, save and share"
- Click "Install page as app..."

**Done!**

## Developer Quick Start

### Pre-req

* Basic knowledge of `node.js` development and TypeScript
* `npm` & `npx` installed

### Clone the repo

```sh
git clone https://github.com/johan162/commute.git
```

### Initialize dev environment

```sh
cd commute
npm installl
```

### Do a bare bones build to check everything

```sh
npm run build
```

After this you are ready to start contributing. Read `DEVELOPER_README.md` for architectural overview and more details.






