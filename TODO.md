# Upcoming Feature/Fixes before v1.0.0


## ✨ FEATURES
- Make it possible to protect history & statistics with password. This can be enabled/disabled in the "Settings" tab
- Make it possible to delete individual old records that may have been recorded in error
- Make it possible to set the proximity zone for arriving at work location in the "Settings" tab
- Make it possible (via setting in "Settings" tab) to automatically record the position when the timer is stopped as the work location
- Make it optional for the GPS GeoFence auto-turn off by a setting in them "Settings" tab


## 🐛 BUGS
- Investigate why 90% CI shows non-existent commute times. Only actual commute time should be possible to show and not computed averages


## 🛠 INTERNAL Improvements

- Add an option to `mkbld.sh` to make the final push to `gh-pages` and don't do it by default
- Harmonize `mkbld.sh` with `mkrelease.sh` in terms of parameter and handling of logging
- Add `mkghrelease.sh` script to make a GitHub release (using `gh` CLI tool)
 

&nbsp;
&nbsp; 
&nbsp;

# Completed features/fixes

- [feat] Add 90% CI

