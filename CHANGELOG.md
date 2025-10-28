## [0.3.6] - 2025-10-28

Release type: patch

### 🛠 Internal
- [chore] Make release script less verbose


## [0.3.5] - 2025-10-28

Release type: patch

### 🛠 Internal
- [bug] Cleanup release script and fix BSD vs. GNU sed issue


## [0.3.4] - 2025-10-28

Release type: patch

### 🛠 Internal
- [bug] More fixes in release script


## [0.3.3] - 2025-10-28

Release type: patch

### 🛠 Internal
- [bug] Forgot merge back main into develop after squash merge of develop to main


## [0.3.2] - 2025-10-28

Release type: patch

### 🛠 Internal
- [chore] Add instruction for app install in Chrome


## [0.3.1] - 2025-10-27

Release type: patch

### 🛠 Internal
- [chore] Ignore the `.vite` directory 
- [chore] Ignore the artifacts in the `gh-pages` directories `.gitignore` file


## [0.3.0] - 2025-10-27

Release type: minor

### 📋 Summary 
- This release includes many major improvements in both application and PDF report.

### ✨ Additions
- [feat] Add proper charts for time of day breakdown in PDF export
- [feat] Add proper histogram charts for commute duration in PDF export
- [chan] Reorder the PDF export to move recent records last to its own page
- [feat] Make it possible to delete individual old records that may have been recorded in error
- [feat] Make it optional for the GPS GeoFence auto-turn off by a setting in them "Settings" tab
- [feat] Make it possible to set the proximity zone for arriving at work location in the "Settings" tab
- [feat] Add 90% CI to PDF Report
- [feat] Add both Nearest-Rank and Interpoated 90% CI
- [feat] Add 90% CI

### 🚀 Improvements
- [chore] Added DEVELOPER_README to give an architectural and code overview together with code styling guidelines

### 🐛 Bug Fixes
- NA

### 🛠 Internal
- [chore] Add an option to `mkbld.sh` to make the final push to `gh-pages` and don't do it by default
- [chore] Harmonize `mkbld.sh` with `mkrelease.sh` in terms of parameter and handling of logging
- [chore] Add `mkghrelease.sh` script to make a GitHub release (using `gh` CLI tool)


## [0.2.0] - 2025-10-27

Release type: major

### 📋 Summary 
- First public release of Commute Tracker

### ✨ Features
- Extensive statistics on Commmute Times including 90% CI and Histogram
- GeoFencing to automatically detect arrival at work to stop the timer
- Options to export as either CSV data and PDF report
- Written as a Progressive Web App (PWA) so it runs on any platform and can be installed as an off-line App
- Dark theme intuitive UI



