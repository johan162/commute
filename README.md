# Commute Time Tracker PWA

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.16.3-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)
![Bundle Size](https://img.shields.io/bundlephobia/min/commute)

A simple and efficient Progressive Web App (PWA) to track your commute time to work. It provides detailed statistics and visualizations to help you understand your travel patterns.

<img src="docs/screenshots/01. MainScreen.png" width="30%">


## Features
### Core Features
- **Timer Tracking**: Start/stop commute tracking with GPS integration for accurate distance and time.
- **Geofencing**: Automatically stops tracking when you arrive at work (customizable radius).
- **Bayesian work location updates**: Use Bayesian weighted updates of work location

<img src="docs/screenshots/13. Settings-Autostop.png" width="30%">
<img src="docs/screenshots/14. Setings-Work-Location.png" width="30%">

### Advanced Analytics
- **Basic Statistics**: Average, best, and worst commute times with easy to read visualizations.
- **Advanced Statistics**: Trend analysis (Mann-Kendall test), pattern detection (Runs test), normality testing (Shapiro-Wilk), and Q-Q plots with R² metrics to uncover commute patterns.

<img src="docs/screenshots/03. Stat-Histogram.png" width="30%">
<img src="docs/screenshots/09. Mann-Kendall.png" width="30%">
<img src="docs/screenshots/10. Runs.png" width="30%">

### Data & Export
- **History View**: Browse complete commute logs to spot trends.
- **PDF Reports**: Generate professional summaries for sharing or archiving.
- **Data Export**: Download commute data as CSV for external analysis.

<img src="docs/screenshots/11. Export.png" width="30%">


### App Experience
- **Progressive Web App**: Installable on phones/tablets with offline support and a modern dark-themed UI.
- **Privacy-First**: All data stored locally—no remote tracking or telemetry.


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

## How to Use

1. **Start Tracking**: Tap "Start Commute" when leaving home. The app uses GPS to track your route.
2. **Automatic Stop**: Enable geofencing in Settings to auto-stop when arriving at work.
3. **View Insights**: Check the Statistics tab for trends, or export data as CSV/PDF.
4. **Customize**: Adjust settings like radius or weekend inclusion for personalized analytics.
For detailed guidance, see the complete [User Guide](docs/USER_GUIDE.md).


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
> npm install
```

### Do a bare bones build to check everything

```sh
> npm run build
> npm run test:coverage
```

### Serve the app locally

```sh
> npm run dev

 VITE v7.1.12  ready in 155 ms

  ➜  Local:   http://localhost:5173/commute/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Contributing
We welcome contributions! See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for architecture details.
- Fork the repo and create a feature branch.
- Run build with Quality-gates: `scripts/mkbld.sh` (or use the Makefile with `make build`)
- Submit a pull request with a clear description.
Report bugs via [GitHub Issues](https://github.com/johan162/commute/issues).


## License


```txt
MIT License

Copyright (c) 2025 Johan Persson <johan162@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```






