## [0.19.2] - 2025-11-02

Release type: patch

### 📋 Summary 
- Critical stupid bug-fix

### 🐛 Bug Fixes
- [bug] Path for `getDistance()` function was wrong so AutoStop didn't work!


## [0.19.1] - 2025-11-02

Release type: patch

### 📋 Summary 
- Added utility git script

### 🛠 Internal
- [feat] Added `pull-all.sh` script to update all branches with corresponding origin
  

## [0.19.0] - 2025-11-02

Release type: minor

### 📋 Summary 
- More nuanced statistic presentation

### 🚀 Improvements
- [upd] Split 90% CI into morning and evening


## [0.18.0] - 2025-11-01

Release type: minor

### 📋 Summary 
- Improved data management

### ✨ Additions
-[feat] Added data import from CSV in settings tab

### 🛠 Internal
- [upd] Tweaks in Makefile and build scripts to do typechecking and run tests before doing the heavy production build of App-chunks. `make` is now the preferred build method.


## [0.17.2] - 2025-11-01

Release type: patch

### 📋 Summary 
- Usability improvements

### 🚀 Improvements
- [upd] Require one or more recorded work locations to be able to enable AutoStop


## [0.17.1] - 2025-11-01

Release type: patch

### 🚀 Improvements
- [upd] Improve guide texts in stat view
- [upd] Reorder the setting page to make setting work location at top


## [0.17.0] - 2025-11-01

Release type: minor

### 📋 Summary 
- Make statistics tab more user friendly

### ✨ Additions
- [feat] Add toggle in setting to hide/view advanced statistical analysis

### 🐛 Bug Fixes
- [bug] The generation of lognormal test data is no longer broken


## [0.16.6] - 2025-10-31

Release type: patch

### 📖 Documentation
- [upd] Some rewording and typos fixed un User Guide
- [upd] Improved PDF generation of User Guide with custom CSSS

### 🛠 Internal
- [upd] Aded two more data generators, one for bimodal distribution and one for trending data set.


## [0.16.5] - 2025-10-31

Release type: patch

### 📖 Documentation
- [upd] Added screenshots to README.md


## [0.16.4] - 2025-10-31

Release type: patch

### 📖 Documentation
- [upd] Added screenshots to README.md 


## [0.16.3] - 2025-10-30

Release type: patch

### 🚀 Improvements
- [upd] Make the heatmap scroll horizonatally and have unlimited window width


## [0.16.2] - 2025-10-30

Release type: patch

### 🚀 Improvements
- [upd] Fewer weeks (16w) in heatmap to fit phone screen better


## [0.16.1] - 2025-10-30

Release type: patch

### 🐛 Bug Fixes
- [bug] Possibly undefined varable before usage in CalendarHeatmap component


## [0.16.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Added som heat!

### ✨ Additions
- [feat] Added heatmap modelled after GitHub commit heat map


## [0.15.2] - 2025-10-30

Release type: patch

### 🚀 Improvements
- [upd] Adjust height of Nixie digits


## [0.15.1] - 2025-10-30

Release type: patch

### 🚀 Improvements
- [upd] Adjust height of Nixie digits


## [0.15.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Made the timer digits more interesting

### ✨ Additions
- [feat] Added styling of timer to look lke old style Nixie-tubes (with CSS - not images)


## [0.14.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Improve statistical chart display

### 🚀 Improvements
- [upd] Make X-axis ticsks for time of day have 45 degree angles
- [upd] Make it selectable to display either mean or median for time of day breakdown
- [upd] Show number of records in History View


## [0.13.1] - 2025-10-30

Release type: patch

### 🛠 Internal
- [bug] Generated debug data to test statistics could have dates in the future
 

## [0.13.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Minor chart improvement

### 🚀 Improvements
- [upd] Add adjustable bin sizes to Time of Day Breakdown Chart


## [0.12.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Usability improvements

### ✨ Additions
- [feat] Add sorting of data in history view

### 🚀 Improvements
- [upd] Improved data formatting and order of apperance in the statistic tab
  
### 🛠 Internal
- [upd] More realistic generation of test data in the "Debug" card for testing statistics with large data sets.


## [0.11.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Major internal improvements by adding test-frameworks.

### 📖 Documentation
- [upd] Added detailed information on how to setup tests, write tests and execute the test-suite.

### 🛠 Internal
- [feat] Added unit-test and intgration-test framework
- [feat] Added Quality gates of > 75% code coverage to all build and release processes
- [feat] Added a Makefile as the central point of execution and status checking


## [0.10.0] - 2025-10-30

Release type: minor

### 📋 Summary 
- Add Bayesian weighted calculation of Work location

### 🚀 Improvements
- [upd] Use Bayesian update of work locations that takes accuracy of new GPS position into account.
- [upd] Removed some uneccessary long Guide texts in the Settings tab and rewrote other tk be more succint

### 📖 Documentation
- [upd] Add information in User Guide about the Bayesian update
- [upd] Add detailed technical description of the Bayesian update in the Developer Guide

### 🛠 Internal
- [upd] Minor optimization in StatsView to avoid recreating the `duration` array multiple times.


## [0.9.1] - 2025-10-29

Release type: patch

### 📋 Summary 
- Improve setting logic for AutoStop

### 🚀 Improvements
- [upd] Make it possibke to adjust all settings of auto-stop even though the feature itself is turned off.


## [0.9.0] - 2025-10-29

Release type: minor

### 📋 Summary 
- Add better internal debug capability

### 🐛 Bug Fixes
- [bug] Fix incorrect calculation of R2 statistics in the handling of Q-Q-plot

### 🛠 Internal
- [chore] Add ha idden debug card at the end of the setting tab to create known distributions to validate the statics calculations with.
  

## [0.8.4] - 2025-10-29

Release type: patch

### 📖 Documentation
- [upd] Add information in README.md about automatic Application update after it has been installed


## [0.8.3] - 2025-10-29

Release type: patch

### 🚀 Improvements
- [upd] Tweak layout margins of Q-Q plot


## [0.8.2] - 2025-10-29

Release type: patch

### 🚀 Improvements
- [upd] Tweak tick-marks by implementing our own tick marks selection algorithm as the built-in is piss-poor.


## [0.8.1] - 2025-10-29

Release type: patch

### 🚀 Improvements
- [upd] Tweak layout of Q-Q plot


## [0.8.0] - 2025-10-29

Release type: minor

### 📋 Summary 
- Work location feature update together with update of general user docs

### ✨ Additions
- [feat] Add display of averaged GPS coordinates in Lat/Long format with map-link

### 📖 Documentation
- [upd] Add information about Q-Q plots and R² statistics


## [0.7.0] - 2025-10-29

Release type: minor

### 📋 Summary 
- Added Q-Q plot to help visually asses the fit to a normal distribution together with R² statistics

### ✨ Additions
- [feat] Add Q-Q plot to statistics tab


## [0.6.2] - 2025-10-29

Release type: patch

### 🚀 Improvements
- [upd] Add delete button to clear work location in settings tab


## [0.6.1] - 2025-10-29

Release type: patch

### 🚀 Improvements
- [upd] Include MIT License text in "About" card


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



