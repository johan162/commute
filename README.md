# Commute Time Tracker PWA

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.8.4-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)
![Bundle Size](https://img.shields.io/bundlephobia/min/commute)

A simple and efficient Progressive Web App (PWA) to track your commute time to work. It provides detailed statistics and visualizations to help you understand your travel patterns.

## Features

- **Basic Statistics:** Get detailed insights into your commute times, including average, best, and worst travel times.
- **Advance Statistics:** Trend analysis (Mann-Kendall), pattern analysis (Runs Test) and normality test (Shapiro-Wilk), Q-Q plot with R² statistics to give insights in commute patterns.
- **History View:** Browse a complete history of your commutes to identify trends and patterns.
- **Geo-Fencing:** The app can automatically stop tracking when you arrive at your work destination, so you don't have to remember to do it manually.
- **PDF Report**: Professional loooking PDF summary report.
- **Data export**: Export data for offline processing in CSV format.
- **Progressive Web App:** Installable on any phone or tablet, providing a native app-like experience with a modern reactive UI in a dark theme
- **Data Privacy:** Data is only stored locally. No telemetry!


## User Quick Start 

**Note on privacy:** Again, data is **ONLY** stored locally in the browser/App. No remote data is saved! 

* **Step 1:** Open the App URL on your device: [https://johan162.github.io/commute](https://johan162.github.io/commute)

* **Step 2:** To install this as an offline App do the following depending on OS:

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


## Updating a previously installed app

The good new is that this happens automatically (in theory) but depending on OS there are some crucial differences.

**iOS:** If you are on an iOS device the bad news are that this check only happens roughly every 24h (the exact interval is unknown) and will require
a complete App restart (swiping it away from the multitasking App switcher). 

* **In short on iOS:** Updates are automatic but slow and require a full app restart. Refreshing does nothing.

**Android:** On Android/Chrome Desktop this is almost instant as the service worker in the background will agressively check for new versions in the original URL  and 
may even prompt you to swipe down to refresh the app. 

* **In short on Android:** Updates can be near-instantaneous and are triggered by a simple refresh, often guided by an in-app prompt.

### Summary of OS differences

| Feature | iOS (Home Screen PWA) | Android / Desktop Chrome |
| :--- | :--- | :--- |
| **Update Trigger** | Automatic, periodic (~24h cycle) | On navigation/startup |
| **Manual Refresh** | Does **not** trigger an update check | **Does** trigger an update check |
| **Activation** | Requires a full app restart (close & reopen) | On next navigation/refresh |
| **User Notification** | None (it's silent) | Possible via in-app prompts |
| **Update Speed** | Slow (can take over 24 hours to appear) | Fast (can be immediate) |



&nbsp;
&nbsp;

## Developer Quick Start

### Pre-reqs

* Basic knowledge of `node.js` development and TypeScript
* `npm` & `npx` installed

### Clone the repo

```sh
> git clone https://github.com/johan162/commute.git
```

### Initialize dev environment

```sh
> cd commute
> npm installl
```

### Do a bare bones build to check everything

```sh
> npm run build
```

### Serve the app locally

```sh
> npm run dev

 VITE v7.1.12  ready in 155 ms

  ➜  Local:   http://localhost:5173/commute/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```


After this you are ready to start contributing. Read `DEVELOPER_README.md` for architectural overview and more details.






