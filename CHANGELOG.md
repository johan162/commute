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

