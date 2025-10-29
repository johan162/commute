# Commute Tracker User Guide

Welcome to **Commute Tracker**! This guide will help you get the most out of your commute tracking experience and understand all the powerful features at your fingertips.

## 📱 What is Commute Tracker?

Commute Tracker is a smart, privacy-focused application that helps you:
- **Track** your daily commute times with GPS precision
- **Analyze** patterns and trends in your travel data
- **Optimize** your departure times based on real statistics
- **Learn** fascinating insights about your daily routine

Best of all, it's a **Progressive Web App (PWA)**, which means it works offline, installs like a native app, but requires no app store and respects your privacy by keeping all data on your device.

---

## 🗺️ Application Overview

```
Commute Tracker
│
├── 🏠 Main View
│   ├── Start/Stop Timer
│   ├── Current Commute Display
│   └── Quick Statistics
│
├── 📊 Statistics View
│   ├── Summary Statistics
│   ├── Confidence Intervals
│   ├── Normality Test (Shapiro-Wilk)
│   ├── Trend Analysis (Mann-Kendall)
│   ├── Pattern Analysis (Runs Test)
│   ├── Commute Duration Histogram
│   ├── Time Distribution Charts
│   ├── Total Commute Time Analysis
│   └── Export Functions (CSV/PDF)
│
├── 📜 History View
│   ├── Chronological Record List
│   ├── Individual Record Details
│   └── Delete Records
│
└── ⚙️ Settings View
    ├── AutoStop Feature
    ├── Work Location Management
    ├── Auto-Stop Radius Configuration
    ├── Data Management
    └── About
```

---

## 🚀 Getting Started

### Installing the App

**Commute Tracker is a Progressive Web App (PWA)** - a modern web technology that combines the best of websites and native apps:

#### What's a PWA?
Think of a PWA as a website that behaves like a phone app:
- ✅ **Works offline** - Once loaded, you can use it without internet
- ✅ **Installs to your device** - Appears on your home screen like any app
- ✅ **No app store needed** - Install directly from your browser
- ✅ **Always up-to-date** - Updates automatically when online
- ✅ **Privacy-first** - All your data stays on YOUR device, never sent to servers
- ✅ **Cross-platform** - Works on iPhone, Android, tablets, and computers

#### Installation Steps

URL: [https://johan162.github.io/commute](https://johan162.github.io/commute)

**On iPhone/iPad (Safari):**
1. Open the app URL in Safari
2. Tap the **Share** button (box with arrow, top-right corner)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon appears on your home screen!

**On Android (Chrome):**
1. Open the app URL in Chrome
2. Click the extended menu (three vertical dots)
3. Select **"Add to home screen"**
4. In the popup shown choose **"Install as App"**
5. The app icon appears in your app drawer!

**On Desktop (Chrome/Edge):**
1. Open the app URL
2. Clicke the extended menu (three vertical dots)
3. Select **"Cast, save and share"**
3. Click **"Install page as app..."**
- Click "Install page as app..."


### First-Time Setup

1. **Grant Location Permission**: The app needs GPS access to track your commute
2. **Record Your Work Location** (optional): For automatic arrival detection. **Note:** There are options to enable automatic recording of position when timer is stopped.
3. **Take Your First Commute**: Hit "Start Commute" and let the tracking begin!

---

## 🏠 Main View - Your Command Center

The Main View is your starting point for every commute.

### Starting a Commute

1. **Press "Leaving"** when you leave home
2. The timer starts immediately
3. A large, easy-to-read display shows your elapsed time
4. Your GPS location is recorded

### Stopping a Commute

**Manual Stop:**
- Press **"Arrive"** when you arrive at work
- The time is saved automatically

**Automatic Stop (with AutoStop enabled):**
- The timer stops automatically when you enter your work location radius
- No button press needed - just arrive and it's recorded!
- Perfect for hands-free operation

### What You See

- **Large Timer Display**: Shows hours, minutes, and seconds
- **Current Status**: "Commute started.." or "Press 'Leaving' to start"
- **Quick Stats**: Your average commute time is always visible
- **Record Count**: See how many commutes you've tracked

**💡 Pro Tip**: The app works in the background! You can switch to other apps, lock your phone, or even close the browser - the timer keeps running.

---

## 📊 Statistics View - Discover Your Patterns

This is where the magic happens! The Statistics View transforms your raw commute data into actionable insights.

### Summary Statistics

Your basic numbers at a glance:

- **Total Trips**: How many commutes you've recorded
- **Min Time**: Your fastest commute ever (aim to beat it!)
- **Max Time**: Your slowest commute (avoid whatever caused this!)
- **Average**: Your typical commute time
- **Median**: The "middle" time when your commutes are sorted

**What's the difference between Average and Median?**
- **Average** adds all times and divides by the count. A few very slow commutes can pull this up.
- **Median** is the middle value. It's more resistant to outliers (those days with terrible traffic).

If your median is much lower than your average, you have some unusually slow commutes pulling up the average!

### 90% Confidence Intervals

Two cards show you where 90% of your commutes fall:

**Interpolated Interval:**
- Uses mathematical calculation
- Shows the precise range where 90% of commutes land
- May show times you've never actually experienced

**Nearest Rank Interval:**
- Uses your actual recorded times
- Shows the closest real commutes to the 90% boundaries
- More "tangible" - these are times that actually happened

**Practical Use:**
- **Planning**: If your 90% CI upper bound is 35 minutes, leave at least 35 minutes before you need to arrive
- **Realistic Expectations**: You'll arrive within this range 9 out of 10 times
- **Buffer Time**: The difference between low and high tells you how unpredictable your commute is

### 🔬 Normality Test (Shapiro-Wilk)

*Requires 20+ commutes*

**What is it?**
A statistical test that checks if your commute times follow a "normal distribution" (the famous bell curve).

**The Bell Curve:**
Imagine most commutes cluster around your average (say, 25 minutes), with fewer commutes being very fast (20 min) or very slow (30 min). This creates a bell-shaped pattern.

**What You See:**
- **W Statistic** (0 to 1): Closer to 1 means more "normal"
- **p-value**: The probability your data matches a bell curve
- **Result**: ✓ Normal or ⚠ Not Normal

**Why Does This Matter?**

**If NORMAL (p > 0.05):**
- Your commute is predictable and consistent
- Most days are similar to your average
- Standard planning methods work well
- Statistical predictions are reliable

**If NOT NORMAL (p ≤ 0.05):**
- Your commute has distinct patterns or clusters
- Maybe Mondays are always slower, or weather impacts you significantly
- You might have multiple "typical" commute times
- Look for patterns in your history to understand why

**🎯 Real-World Example:**
Sarah's commute shows "Not Normal" because she has two distinct patterns: 
- Fast commutes (20-22 min) when she leaves before 7 AM
- Slow commutes (35-40 min) when she leaves after 7:15 AM
Her solution? Always leave before 7 AM!

### 📈 Trend Analysis (Mann-Kendall Test)

*Requires 10+ commutes*

**What is it?**
Detects if your commute times are getting systematically longer, shorter, or staying stable over time.

**What You See:**
- **Trend Direction**: 
  - 📈 Getting Longer - Bad news!
  - 📉 Getting Shorter - Great news!
  - ➡️ Stable - Consistent and predictable
  
- **Confidence Level**:
  - 💪 Very Strong - Definitely happening (p < 0.01)
  - 👍 Moderate - Probably real (p < 0.05)
  - 🤔 Weak - Might be real (p < 0.10)
  - 🤷 Not Significant - Just random variation

**Why Does This Matter?**

**Getting Longer 📈:**
- Traffic is worsening in your area
- Seasonal changes (winter weather, school schedules)
- Construction or road changes
- **Action**: Consider alternative routes or departure times

**Getting Shorter 📉:**
- Your route is improving!
- You've learned the traffic patterns
- Infrastructure improvements
- **Action**: Keep doing what you're doing!

**Stable ➡️:**
- Predictable commute - easy to plan around
- Consistent traffic patterns
- **Action**: Your current routine is working well

**🎯 Real-World Example:**
Mike notices his commute trending upward (📈) over 3 months. He investigates and finds a new shopping center opened along his route. He switches to a parallel road and his times stabilize, then trend downward!

### 🌊 Pattern Analysis (Runs Test)

*Requires 10+ commutes*

**What is it?**
Detects if your commute times are truly random or show patterns of clustering or oscillation.

**What You See:**
- **Pattern Type**:
  - 🎲 **Random** - Each commute is independent, no predictable pattern
  - 📦 **Clustered** - Similar times grouped together (several fast days, then several slow days)
  - 🌊 **Oscillating** - Alternating between fast and slow commutes

**Why Does This Matter?**

**Random 🎲:**
- Daily traffic is unpredictable
- Each day is a fresh start
- Weather or random events dominate
- **Strategy**: Build in buffer time, accept variability

**Clustered 📦:**
- You have multi-day patterns
- Might be weekly cycles (slow Mondays, fast Fridays)
- Weather patterns (rainy weeks vs. sunny weeks)
- **Strategy**: Look at your calendar - can you identify the clusters? Adjust plans for "slow periods"

**Oscillating 🌊:**
- Every-other-day pattern
- Might relate to your schedule (early days vs. late days)
- Behavioral factors
- **Strategy**: Track what makes "fast days" fast and replicate it

**🎯 Real-World Example:**
Jessica's data shows clustering (📦). She realizes her commute is fast Monday-Wednesday (leaves at 6:45 AM for gym) but slow Thursday-Friday (leaves at 7:30 AM). Now she knows: leave before 7 AM for a fast commute, or expect 10 extra minutes if leaving later.

### 📊 Commute Duration Histogram

A visual chart showing how your commute times are distributed.

**How to Read It:**
- **X-axis** (bottom): Commute time ranges (e.g., 20-25 minutes, 25-30 minutes)
- **Y-axis** (left side): Number of commutes in each range
- **Bars**: Taller bars = more commutes in that time range

**What to Look For:**
- **Single Peak**: One tall bar in the middle = consistent commute
- **Two Peaks**: Two tall bars = you have two "typical" commute times
- **Long Tail**: Bars stretching far right = occasional really slow commutes
- **Bin Size Slider**: Adjust to see more/less detail (1, 2, 5, or 10-minute groupings)

**💡 Insight**: If you see two distinct peaks, dig into your history to understand what causes each pattern!

### 🕐 Time of Day Breakdown

A circular chart showing when your commutes happen.

**Features:**
- See which hours you commute most often
- Identify your typical departure time
- Spot irregular patterns (maybe you should leave earlier?)

### ⏱️ Total Commute Time Analysis

Calculate how much time you've spent commuting over different periods.

**Available Views:**
- **Per Day**: Select any date
- **Per Week**: Choose a week (Monday-Sunday)
- **Per Month**: Monthly totals
- **Per Year**: Annual summation

**Why Track This?**
- **Work-Life Balance**: See how much time commuting takes from your life
- **Justification**: Data to support working from home or relocating
- **Goal Setting**: Track if route changes save cumulative time

**🎯 Fun Fact**: If you commute 30 minutes each way, 5 days a week, that's over 250 hours per year - more than 10 full days!

### 📤 Export Your Data

Share, backup, or analyze your data elsewhere:

**CSV Export:**
- Opens in Excel, Google Sheets, or any spreadsheet app
- Contains all your raw data with timestamps
- Perfect for custom analysis

**PDF Export:**
- Beautiful summary report with charts
- Includes all statistics
- Great for sharing with coworkers or family
- Perfect for "Show and Tell" at work!

---

## 📜 History View - Your Commute Timeline

Browse every commute you've ever recorded.

### What You See

A chronological list (newest first) of all your commutes:
- **Date & Time**: When the commute started
- **Duration**: How long it took
- **Day of Week**: Helps spot weekly patterns
- **Visual Styling**: Color-coded by speed (fast = green, slow = red)

### Managing Records

**Delete Individual Records:**
- Made a mistake? Left the timer running?
- Tap the **edit** icon in the top row
- Select the recods you want to delete (tickbox)
- Tap the red **"Delete"** button at bottom
- Confirm deletion
- Statistics automatically update

**🛡️ Data Integrity**: Deleting records immediately updates all statistics and charts.

---

## ⚙️ Settings View - Customize Your Experience

### AutoStop Feature 🎯

**What is it?**
Automatic arrival detection using GPS geofencing - the app stops the timer when you arrive at work, without you touching your phone!

**How It Works:**

1. **Virtual Fence**: You define a circular area around your work location
2. **GPS Monitoring**: The app continuously checks your location while the timer runs
3. **Automatic Trigger**: When you enter the fence radius, the timer stops automatically
4. **Save Time**: The commute is recorded without any action from you

**The Technology: Geofencing**

Geofencing creates an invisible circular boundary around a location:
```
        Work Building 🏢
             (●)
          .-'   '-.
        /     ●     \    <- 50m radius fence
       |             |
        \           /
          '-.___ -'
```

When your phone's GPS detects you've crossed the boundary, it triggers an action (stopping the timer).

**Why Use AutoStop?**

✅ **Safety**: No need to touch your phone while parking or walking
✅ **Convenience**: Fully hands-free operation
✅ **Accuracy**: Stops at the exact moment of arrival
✅ **Consistency**: Never forget to stop the timer

### Work Location Setup

**Recording Your Work Location:**

**Method 1: Manual Recording**
1. Go to Settings tab
2. Make sure you're physically at work
3. Tap **"Record Current Location"**
4. Your GPS coordinates are saved

**Method 2: Auto-Record**
1. Enable **"Auto-record Work Location"** toggle
2. Every time you stop the timer manually, your current location is recorded
3. Perfect for learning your work location over time

**Multiple Recordings:**
- Record your work location multiple times (5-10 times is ideal)
- The app averages all recordings for accuracy
- Accounts for GPS drift and parking spot variations
- More recordings = more accurate center point

**Why Multiple Recordings?**
GPS isn't perfect - it can be off by 5-20 meters. By recording multiple times from different spots (your parking space, the building entrance, your desk by a window), the app calculates the true center of your work area.

### Auto-Stop Radius Configuration

**The Radius Slider (10m - 250m):**

Choose how close you need to be before the timer stops:

**Small Radius (10-50m):**
- ✅ Very precise - stops only when you're really there
- ✅ Avoids false triggers
- ❌ Might not trigger in parking garages or buildings with poor GPS
- **Best for**: Surface parking, outdoor work locations

**Medium Radius (50-100m):**
- ✅ Balanced approach
- ✅ Works reliably in most situations
- ✅ Stops when you're clearly "at work"
- **Best for**: Most users - start here!

**Large Radius (100-250m):**
- ✅ Always triggers, even with GPS inaccuracies
- ✅ Works in underground parking or thick buildings
- ❌ Might stop before you actually arrive
- **Best for**: Dense urban areas, GPS-challenged locations

**🎯 Recommendation**: Start with 75-100m, then adjust based on experience:
- Timer stopping too early? Reduce radius
- Timer not stopping? Increase radius

### Data Management

**Clear All Data:**
- Permanently deletes all your commute records
- Erases work location recordings
- Resets the app to day-one state
- ⚠️ **Cannot be undone!** - Use with caution

**When to use:**
- Starting fresh after a move or job change
- Selling/giving away your device
- Want to start a new tracking period

### About

Information about the app, technologies used, license, and credits.

---

## 💡 Tips & Tricks

### Getting the Most Accurate Data

1. **Consistent Start Point**: Try to start the timer at the same point each day (your driveway, parking lot exit, etc.)
2. **Let GPS Stabilize**: Wait 5-10 seconds after starting for GPS to lock in
3. **Keep Location On**: The app needs location services enabled for the entire commute
4. **Battery Considerations**: GPS tracking uses more battery - keep a charger handy for long commutes

### Interpreting Your Statistics

**"Normal" Day vs. Outlier:**
- If one commute is way outside your confidence interval, something unusual happened
- Check the date - was there weather, an accident, or special event?

**Tracking Experiments:**
- Try a new route? Record for a week and compare statistics
- Test different departure times and see what works best

**Seasonal Patterns:**
- Expect your statistics to change with seasons (school schedules, weather, holidays)
- Consider "clearing data" and starting fresh each season for relevant insights

### Privacy & Security

**Your Data is YOURS:**
- Everything stays on YOUR device
- No accounts, no cloud, no servers
- No one can see your data unless you share it (via export)
- Uninstalling the app deletes all data

**Location Privacy:**
- The app never sends your location anywhere
- GPS data is only used for timer functions
- Work location coordinates stay local

---

## 🎓 Learning More - The Fun of Data

### Why Statistics are Cool (and Useful!)

You might think "statistics" sounds boring or complicated, but it's really just **finding stories in your numbers**. Each test reveals something interesting:

**The Shapiro-Wilk Test** asks: "Am I predictable?"
**The Mann-Kendall Test** asks: "Am I getting better or worse?"
**The Runs Test** asks: "Do I have hidden patterns?"

### Experiments to Try

**The Route Challenge:**
1. Record 10 commutes on your usual route
2. Export the data
3. Try an alternative route for 10 commutes
4. Compare the statistics - which is faster? More consistent?

**The Time Challenge:**
1. Record commutes leaving at different times
2. Look for patterns in your histogram
3. Find your "sweet spot" departure time

**The Weekly Pattern:**
1. Record for a full month
2. Look at the Runs Test result
3. Check if certain days are consistently faster/slower
4. Adjust your schedule accordingly

### Going Deeper

Want to learn more about the statistics?

- **Shapiro-Wilk Test**: Google "normal distribution examples" - see how it applies everywhere from heights to test scores
- **Mann-Kendall Test**: Search "trend analysis in time series" - used for climate data, stock prices, and more
- **Runs Test**: Look up "randomness testing" - used in cryptography and quality control

The same tools used in this app are used by scientists, engineers, and data analysts worldwide. You're now using professional-grade statistical methods!

---

## ❓ Troubleshooting

### Timer Won't Start
- Check location permission is granted
- Ensure the app is loaded (PWA's need to load once when online)
- Try refreshing the page

### AutoStop Not Working
- Verify you've recorded your work location
- Check the AutoStop radius isn't too small
- Ensure location services stay enabled during commute
- GPS may be blocked in underground parking - use manual stop

### Data Not Showing in Statistics
- Minimum records required: 5 for confidence intervals, 10 for trend/runs tests, 20 for normality test
- Check History tab to verify records exist

### App Not Installing
- PWA installation requires HTTPS (secure connection)
- Try a different browser
- Check device storage isn't full

### GPS Inaccuracy
- Cold start can take 30-60 seconds to acquire satellites
- Tall buildings and tunnels block GPS
- Wait in an open area for better accuracy

---

## 🚀 What's Next?

As you collect more data, the statistics become more powerful and insightful. Keep tracking, and you'll discover:

- Your optimal departure time
- Which days to avoid or plan buffer time
- Long-term trends in your commute
- The true cost of your commute in time

Most importantly, you'll have **data-driven insights** to make better decisions about your daily routine.

Happy commuting! 🚗📊✨

---

*Questions? Suggestions? Found this guide helpful? Share your commute insights with friends and colleagues!*

© 2025 Johan Persson | MIT License
