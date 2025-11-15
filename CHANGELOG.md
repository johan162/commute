## [1.5.1] - 2025-11-15

Release type: patch

### 📋 Summary 
- Improvement in Look & Feel for Nixie tube emulation

### 🚀 Improvements
- [upd] Tweak the CSS to make the Nixie tube emulation a bit better 



## [1.5.0] - 2025-11-15

Release type: minor

### 📋 Summary 
- Improved De-bounce functionality with two-modes

### 🚀 Improvements
- [upd] Introduced two modes of de-bounce, disable button or enabled and stops the timer but does not save it.
- [upd] Make it more obvious that there is a list of Workplace that can be expanded on the setting tab

### 📖 Documentation
- Some shortening of README to make it more concise 


## [1.4.2] - 2025-11-15

Release type: patch

### 📋 Summary 
- Improve user experience by not showing mail-button on iPhone as it will not work due to Apple Sandbox restricions

### 🐛 Bug Fixes
- [bug] On iOS. The PWA sandbox is very restrictive and will not allow other applications to be opened. Therefore remove the "Copy & Open Mail" button when running on iOS


## [1.4.1] - 2025-11-15

Release type: patch

### 📋 Summary 
- Try to work-around iOS PWA Sandbox restrictions to open other apps

### 🚀 Improvements
- [upd] Use direct link to see if this can open mail-application in iOS PWA sandbox


## [1.4.0] - 2025-11-14

Release type: minor

### 📋 Summary 
- Enhanced usability of submitting challenge scoring

### 🚀 Improvements
- [feat] Added button to create and populate mail with scoring

### 🛠 Internal
- [upd] Makefile cleanup, keep all dependencies directly in targets


## [1.3.1] - 2025-11-09

Release type: patch

### 📋 Summary 
- Finished short paper describing the scoring algorithm.

### 🚀 Improvements
- [upd] Improved some guide texts in the challenge tab

### 📖 Documentation
- [upd] Added paper describing the scoring algorithm

### 🛠 Internal
- [chore] Added Makefile for latex-processing


## [1.3.0] - 2025-11-05

Release type: minor

### 📋 Summary 
- Added de-bouncer logic to timer button

### 🚀 Improvements
- [feat] Added De-Bouncer with configurable cut-off time to prevent stupendiously short commute time to pollute the data

### 🛠 Internal
- [upd] Add check that npm, npx, and make exists as CLI tools in `mkbld.sh` script.
- [bug] Fix automated retrieval of changelog entry for latest tag in `mkghrelease.sh`


## [1.2.0] - 2025-11-05

Release type: minor

### 📋 Summary 
- Improved scoring algorithm and make sure we only take morning commutes into account for challenge.

### 🚀 Improvements
- [upd] Filter only morning commutes for challenge calculations
- [upd] Tweak the scoring algorithm as to not penalize inherent variance

### 📖 Documentation
- [upd] Updated scoring papoer to reflect the algorithm change
- [upd] Add challenge section in User Guide

### 🛠 Internal
- [upd] Only give warning for dirty directory in std build script and no confirmation question.


## [1.1.0] - 2025-11-04

Release type: minor

### 📋 Summary 
- Added new Tab for managing the Estimation Challenge and made some updates in the documentation.

### ✨ Additions
- [feat] Added new tab to handle the estimation challenge with score calculation based on the actual recorded commute times.

### 🚀 Improvements
- [upd] Streamlined the text in the "About" box on the Settings Tab.

### 📖 Documentation
- [upd] Added information in developer guide about Makefile targets
- [feat] Added paper describing the scoring algorithm


## [1.0.0] - 2025-11-03

Release type: major

### 📋 Summary 
- First public release of Commute Tracker.

