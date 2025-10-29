## [0.6.0] - 2025-10-29

Release type: minor

### 📋 Summary 
- Additional chart for commute times per weekdays

### ✨ Additions
- [feat] Added chart with selectable mean or median commute time per weekday (Mon-Fri or Mon-Sun)

### 📖 Documentation
- [feat] Added User Guide


## [0.5.1] - 2025-10-29

Release type: patch

### 📋 Summary 
- Added more information in "Settings" tab.

### ✨ Additions
- [feat] Added "About" card with list of all used libraries, technologies and License information


## [0.5.0] - 2025-10-29

Release type: minor

### 📋 Summary 
- Add more advanced statistical analysis to help analyze commute patterns.

### ✨ Additions
- [feat] Added Shapiro-Wilk normality test
- [feat] Added Mann-Kendall trend test. This will tell you if commute times are trending up/down over time.
- [feat] Autocorrelation/Runs Test To help reveal weekly patterns or clustering of good/bad commute days.

### 🚀 Improvements
- [upd] Better PWA chunking to improve performance

### 🛠 Internal
- [chore] Store artifacts in separate directory
- [chore] Updated badges shown inn README.md


## [0.4.0] - 2025-10-28

Release type: **minor**

### 📋 Summary 
Minor feature enhancement release and many "under-the-hood" improvements to build and release management.

### ✨ Additions
- [feat] Add option for auto recording of GPS position when timer is stopped as work location

### 📖 Documentation
 - [upd] Add instruction to install App on Desktop Chromg in README.md
 - [upd] Added developer documentation `DEVELOPER_README.md`

### 🛠 Internal
- [bug] Fix BSD vs. GNU sed issue in `mkrelease.sh`
- [chore] Cleanup all release script and also make it less verbose and log execution to file instead
- [bug] Forgot merge back main into develop after squash merge of develop to main
- [chore] Hygiene bump of all relevant node and react libraries to latest release


## [0.3.0] - 2025-10-27

Release type: **minor**

### 📋 Summary 
- This release includes many major feature improvements in both application and PDF report.

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

Release type: **major**

### 📋 Summary 
- First public release of Commute Tracker

### ✨ Features
- Extensive statistics on Commmute Times including 90% CI and Histogram
- GeoFencing to automatically detect arrival at work to stop the timer
- Options to export as either CSV data and PDF report
- Written as a Progressive Web App (PWA) so it runs on any platform and can be installed as an off-line App
- Dark theme intuitive UI



