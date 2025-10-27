# Developer Documentation - Commute Tracker PWA

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Data Structures](#data-structures)
5. [State Management](#state-management)
6. [View System](#view-system)
7. [Navigation & Menu System](#navigation--menu-system)
8. [Hooks](#hooks)
9. [Services](#services)
10. [Components](#components)
11. [Styling](#styling)
12. [Build System](#build-system)
13. [Release Process](#release-process)
14. [Coding Guidelines](#coding-guidelines)
15. [Development Workflow](#development-workflow)

---

## Introduction

Commute Tracker is a Progressive Web App (PWA) built with React, TypeScript, and Vite. It allows users to track their daily commute times with GPS-based automatic stopping when arriving at work. The app stores all data locally in the browser (no backend/telemetry), making it privacy-focused and offline-capable.

**Tech Stack:**
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 3
- **Charts**: Recharts 2
- **PDF Export**: jsPDF with jspdf-autotable
- **PWA Support**: vite-plugin-pwa

---

## Architecture Overview

The application follows a component-based architecture with clear separation of concerns:

```
User Interface (React Components)
         ↓
View Management (App.tsx)
         ↓
State Management (useLocalStorage + useState)
         ↓
Business Logic (Services)
         ↓
Data Storage (localStorage)
```

### Key Design Principles

1. **Local-First**: All data stored in browser localStorage
2. **Component Composition**: Reusable UI components
3. **Type Safety**: Full TypeScript coverage
4. **Separation of Concerns**: Clear boundaries between UI, state, and business logic
5. **Progressive Enhancement**: Works offline as a PWA

---

## Project Structure

```
commute/
├── public/
│   ├── icon.svg              # App icon for PWA
│   └── manifest.json         # PWA manifest
├── scripts/
│   ├── mkbld.sh              # Build and deploy script
│   ├── mkrelease.sh          # Release automation script
│   └── mkghrelease.sh        # GitHub release creation script
├── src/
│   ├── components/           # React UI components
│   │   ├── Button.tsx        # Reusable button component
│   │   ├── Card.tsx          # Container card component
│   │   ├── Header.tsx        # Navigation header
│   │   ├── HistogramChart.tsx        # Duration histogram
│   │   ├── HistoryView.tsx           # Commute history list
│   │   ├── MainView.tsx              # Timer view
│   │   ├── SettingsView.tsx          # Settings/config view
│   │   ├── StatsView.tsx             # Statistics dashboard
│   │   └── TimeBreakdownView.tsx     # Time-of-day chart
│   ├── hooks/                # Custom React hooks
│   │   ├── useCommuteTimer.ts        # Timer logic with GPS
│   │   └── useLocalStorage.ts        # localStorage wrapper
│   ├── services/             # Business logic services
│   │   ├── exportService.ts          # CSV/PDF export
│   │   ├── locationService.ts        # GPS distance calculation
│   │   └── statsService.ts           # Statistical calculations
│   ├── App.tsx               # Root component with routing
│   ├── index.tsx             # App entry point
│   ├── index.css             # Global styles
│   ├── types.ts              # TypeScript type definitions
│   └── vite-env.d.ts         # Vite type definitions
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── tailwind.config.js        # TailwindCSS configuration
├── postcss.config.js         # PostCSS configuration
├── CHANGELOG.md              # Release history
├── LICENSE                   # MIT license
├── README.md                 # User documentation
└── DEVELOPER_README.md       # This file
```

---

## Data Structures

### Core Types (`src/types.ts`)

```typescript
// Geographic coordinates for GPS tracking
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Single commute record
export interface CommuteRecord {
  id: number;        // Unique timestamp-based ID
  date: string;      // ISO 8601 date string
  duration: number;  // Duration in seconds
}

// View navigation type
export type View = 'main' | 'stats' | 'history' | 'settings';
```

### Data Flow

1. **User Action** → Component event handler
2. **State Update** → `App.tsx` state setter
3. **Persistence** → `useLocalStorage` hook auto-saves to localStorage
4. **Re-render** → React updates UI with new state

---

## State Management

State is managed at the root level in `App.tsx` using React hooks:

### Primary State Variables

```typescript
// View state (not persisted)
const [view, setView] = useState<View>('main');

// Persisted state (localStorage)
const [commuteRecords, setCommuteRecords] = useLocalStorage<CommuteRecord[]>('commuteRecords', []);
const [workLocations, setWorkLocations] = useLocalStorage<Coordinates[]>('workLocations', []);
const [autoStopRadius, setAutoStopRadius] = useLocalStorage<number>('autoStopRadius', 50);
const [autoStopEnabled, setAutoStopEnabled] = useLocalStorage<boolean>('autoStopEnabled', true);
```

### Computed State (useMemo)

```typescript
// Average work location from all recorded arrival points
const averageWorkLocation = useMemo<Coordinates | null>(() => {
  if (workLocations.length === 0) return null;
  // Calculate centroid of all work locations
}, [workLocations]);

// Statistical summary
const stats = useMemo(() => {
  if (commuteRecords.length < 1) return null;
  return {
    min: statsService.getMin(durations),
    max: statsService.getMax(durations),
    mean: statsService.getMean(durations),
    median: statsService.getMedian(durations),
    stdDev: statsService.getStdDev(durations),
  };
}, [commuteRecords]);
```

### State Persistence

The `useLocalStorage` hook provides automatic synchronization:
- **Read**: Initializes from localStorage on mount
- **Write**: Saves to localStorage on every state change
- **Parsing**: Handles JSON serialization/deserialization
- **Error Handling**: Falls back to initial value on parse errors

---

## View System

The app uses a simple view-based routing system (no router library):

### View Architecture

```typescript
const renderView = () => {
  switch (view) {
    case 'stats':
      return <StatsView records={commuteRecords} stats={stats} />;
    case 'history':
      return <HistoryView 
        records={commuteRecords} 
        median={stats?.median} 
        onDeleteRecords={deleteCommuteRecords} 
      />;
    case 'settings':
      return <SettingsView 
        onAddLocation={addWorkLocation}
        workLocationCount={workLocations.length}
        onClearAllData={clearAllData}
        autoStopRadius={autoStopRadius}
        onAutoStopRadiusChange={setAutoStopRadius}
        autoStopEnabled={autoStopEnabled}
        onAutoStopEnabledChange={setAutoStopEnabled}
      />;
    case 'main':
    default:
      return <MainView 
        onSaveCommute={addCommuteRecord}
        workLocation={autoStopEnabled ? averageWorkLocation : null}
        autoStopRadius={autoStopRadius}
      />;
  }
};
```

### View Descriptions

| View | Purpose | Key Features |
|------|---------|--------------|
| **MainView** | Timer interface | Start/stop commute tracking, GPS distance display |
| **StatsView** | Statistics dashboard | Charts, averages, confidence intervals, export |
| **HistoryView** | Commute log | Sortable table, date filtering, bulk delete |
| **SettingsView** | Configuration | GPS setup, radius adjustment, data management |

### Information Passing Between Views

**Props Down, Events Up Pattern:**

```typescript
// Parent → Child: Data passed as props
<MainView 
  onSaveCommute={addCommuteRecord}    // Callback function
  workLocation={averageWorkLocation}   // Computed data
  autoStopRadius={autoStopRadius}      // Configuration
/>

// Child → Parent: Events via callbacks
const handleStop = () => {
  onSaveCommute(duration);  // Invokes parent's addCommuteRecord
};
```

---

## Navigation & Menu System

### Header Component

The navigation is implemented in `Header.tsx` as a bottom navigation bar:

```typescript
<Header activeView={view} setView={setView} />
```

**Structure:**
- 4 navigation items (Main, Stats, History, Settings)
- Active state highlighting (cyan color)
- SVG icons with labels
- Responsive layout (flex-based)

**Navigation Items:**

```typescript
<NavItem 
  label="Timer"
  viewName="main"
  activeView={view}
  setView={setView}
  Icon={TimerIcon}
/>
```

Each `NavItem`:
- Displays an icon and label
- Highlights when active (`activeView === viewName`)
- Calls `setView(viewName)` on click
- Uses TailwindCSS for styling

---

## Hooks

### `useLocalStorage<T>` (`src/hooks/useLocalStorage.ts`)

Custom hook for persistent state management.

**Signature:**
```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>]
```

**Usage:**
```typescript
const [records, setRecords] = useLocalStorage<CommuteRecord[]>('commuteRecords', []);
```

**Features:**
- Generic type support
- Automatic JSON serialization
- localStorage sync via useEffect
- Error handling with fallback to initialValue

### `useCommuteTimer` (`src/hooks/useCommuteTimer.ts`)

Complex hook managing timer state and GPS tracking.

**Signature:**
```typescript
interface UseCommuteTimerProps {
  workLocation: Coordinates | null;
  onStop: (duration: number) => void;
  autoStopRadius?: number;
}

function useCommuteTimer(props: UseCommuteTimerProps)
```

**Returns:**
```typescript
{
  isRunning: boolean;
  elapsedTime: number;
  startTimer: () => void;
  stopTimer: (message?: string) => void;
  statusMessage: string;
  distance: number | null;
}
```

**Key Features:**
1. **Timer Persistence**: Survives page refresh via localStorage
2. **GPS Tracking**: Uses `navigator.geolocation.watchPosition()`
3. **Auto-Stop**: Stops timer when within radius of work location
4. **Distance Calculation**: Real-time distance to destination
5. **Cleanup**: Clears intervals and GPS watches on unmount

**State Management:**
- `isRunning`: Timer active state
- `elapsedTime`: Seconds since start
- `statusMessage`: User-facing status text
- `distance`: Meters to work location

---

## Services

### `statsService.ts` - Statistical Calculations

Pure functions for mathematical operations:

```typescript
// Basic statistics
getMin(data: number[]): number
getMax(data: number[]): number
getMean(data: number[]): number
getMedian(data: number[]): number
getStdDev(data: number[]): number

// Percentile calculations
getPercentile(data: number[], percentile: number): number
getPercentileNearestRank(data: number[], percentile: number): number

// Confidence intervals
getConfidenceInterval(data: number[], confidenceLevel: number): { low: number; high: number } | null
getConfidenceIntervalRank(data: number[], confidenceLevel: number): { low: number; high: number } | null
```

**Design Notes:**
- All functions are pure (no side effects)
- Handle edge cases (empty arrays, insufficient data)
- Two percentile methods: interpolated and nearest-rank
- Confidence intervals require ≥5 data points

### `locationService.ts` - GPS Distance Calculation

```typescript
// Haversine formula for distance between coordinates
getDistance(coord1: Coordinates, coord2: Coordinates): number
```

Returns distance in meters between two GPS points.

### `exportService.ts` - Data Export

```typescript
// Export to CSV file
exportToCSV(records: CommuteRecord[]): void

// Export to PDF report with charts
exportToPDF(
  records: CommuteRecord[],
  stats: { min: number; max: number; mean: number; median: number; stdDev: number }
): void
```

**PDF Report Structure:**
1. **Page 1**: Statistics summary, total time tables
2. **Page 2**: Histogram chart, time-of-day breakdown chart
3. Charts use smart scaling (prefer even numbers, then multiples of 5)
4. Y-axis labels aligned with gridlines

**Chart Scaling Algorithm:**
- Priority 1: Even numbers (2, 4, 6, 8, 10, 20, 40, 60, 80, 100, 200)
- Priority 2: Multiples of 5 (5, 15, 25, 50, 150, 250)
- Fallback: Calculated nice intervals
- Ensures 3-6 divisions for readability

---

## Components

### Reusable Components

#### `Card.tsx`
Container component with consistent styling:
```typescript
<Card title="Statistics">
  {children}
</Card>
```

#### `Button.tsx`
Styled button with variants:
```typescript
<Button variant="primary" onClick={handleClick}>
  Save
</Button>
```

### View Components

#### `MainView.tsx`
- Timer display (HH:MM:SS format)
- Start/Stop buttons
- GPS status and distance
- Uses `useCommuteTimer` hook

#### `StatsView.tsx`
- Summary statistics cards
- Histogram chart (configurable bin size)
- Time-of-day breakdown chart
- Export buttons (CSV/PDF)
- Date/year filtering

#### `HistoryView.tsx`
- Sortable data table
- Date filtering (day/week/month/year/all)
- Selection checkboxes
- Bulk delete functionality
- Color coding (green=fast, red=slow)

#### `SettingsView.tsx`
- Work location configuration
- Auto-stop toggle and radius slider
- Data management (clear all)
- Version display

### Chart Components

#### `HistogramChart.tsx`
- Uses Recharts `<BarChart>`
- Configurable bin size (minutes)
- Smart Y-axis scaling
- Responsive layout

#### `TimeBreakdownView.tsx`
- Time slot distribution (5 periods)
- Circular color indicators
- Shows commute count per period

---

## Styling

### TailwindCSS

The app uses utility-first CSS with Tailwind:

**Configuration** (`tailwind.config.js`):
```javascript
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
```

**Color Scheme:**
- Background: `bg-gray-900` (dark)
- Text: `text-gray-100` (light)
- Primary: `text-cyan-400` (accent)
- Cards: `bg-gray-800`

**Responsive Design:**
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`
- Bottom navigation for mobile
- Flexible layouts with flexbox/grid

### Global Styles

`index.css` includes:
- TailwindCSS base layers
- Custom scrollbar styling
- PWA-friendly viewport settings

---

## Build System

### Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  base: '/commute/',  // GitHub Pages path
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: { /* PWA manifest */ }
    })
  ]
})
```

**Key Settings:**
- `base`: Deployment path for GitHub Pages
- PWA auto-update strategy
- Service worker generation
- Icon configuration

### NPM Scripts

```json
{
  "scripts": {
    "dev": "vite",              // Development server
    "build": "vite build",      // Production build
    "preview": "vite preview"   // Preview production build
  }
}
```

### Build Process

1. **Development**: `npm run dev`
   - Starts dev server on `http://localhost:5173`
   - Hot module replacement (HMR)
   - Fast refresh for React

2. **Production Build**: `npm run build`
   - TypeScript compilation
   - Tree-shaking and minification
   - Asset optimization
   - Service worker generation
   - Output to `dist/` directory

3. **Preview**: `npm run preview`
   - Serves production build locally
   - Test before deployment

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js      # Bundled JavaScript
│   ├── index-[hash].css     # Bundled CSS
│   └── icon.svg             # App icon
├── index.html               # Entry HTML
├── manifest.webmanifest     # PWA manifest
└── sw.js                    # Service worker
```

---

## Release Process

### Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `mkbld.sh` | Build and deploy to gh-pages | `./scripts/mkbld.sh` |
| `mkrelease.sh` | Create version release | `./scripts/mkrelease.sh <version>` |
| `mkghrelease.sh` | Create GitHub release | `./scripts/mkghrelease.sh` |

### 1. Build and Deploy (`mkbld.sh`)

**Purpose**: Build app and deploy to gh-pages branch

**Process:**
1. Validates git repository
2. Warns about uncommitted changes
3. Cleans previous build
4. Runs `npm run build`
5. Checks dist directory exists and has content
6. Switches to gh-pages branch
7. Copies dist/* to branch root
8. Creates `.nojekyll` file (for GitHub Pages)
9. Commits with timestamp
10. Returns to original branch

**Usage:**
```bash
./scripts/mkbld.sh
git push origin gh-pages  # Manual push to remote
```

**Error Checking:**
- ✅ Verifies git repository
- ✅ Checks gh-pages branch exists
- ✅ Validates build output
- ✅ Confirms files to commit
- ✅ Restores original branch

### 2. Version Release (`mkrelease.sh`)

**Purpose**: Automated semantic versioning and release preparation

**Arguments:**
- `<version>`: Semantic version (e.g., 0.2.0)
- `[release-type]`: major, minor, or patch (default: minor)

**Quality Gates:**
1. Git repository validation
2. Clean working directory check
3. Branch verification (must be on `develop`)
4. Version format validation (semver)
5. TypeScript compilation check
6. Build verification

**Process:**
1. Validates prerequisites
2. Updates version in:
   - `package.json`
   - `metadata.json`
   - `App.tsx`
3. Updates `CHANGELOG.md`
4. Commits changes
5. Merges to `main` branch
6. Creates git tag
7. Returns to `develop` branch

**Usage:**
```bash
# Create a minor release
./scripts/mkrelease.sh 0.2.0 minor

# Create a major release
./scripts/mkrelease.sh 1.0.0 major

# Create a patch release
./scripts/mkrelease.sh 0.1.1 patch
```

**Notes:**
- Must be on `develop` branch
- Working directory must be clean
- Creates annotated git tag
- Updates CHANGELOG automatically

### 3. GitHub Release (`mkghrelease.sh`)

**Purpose**: Create GitHub release with assets

**Prerequisites:**
- GitHub CLI (`gh`) installed
- Authenticated with GitHub
- `mkrelease.sh` completed successfully
- On `main` branch with pushed tag

**Process:**
1. Detects latest tag
2. Extracts release notes from CHANGELOG
3. Builds distribution assets
4. Creates GitHub release
5. Uploads dist.zip as asset
6. Marks as pre-release if version contains `-`

**Usage:**
```bash
# Automatic release creation
./scripts/mkghrelease.sh

# Force pre-release
./scripts/mkghrelease.sh --pre-release

# Show help
./scripts/mkghrelease.sh --help
```

**Release Assets:**
- Source code (auto)
- `dist.zip` (built assets)

### Complete Release Workflow

```bash
# 1. Develop and test features on develop branch
git checkout develop
# ... make changes ...
git commit -m "feat: Add new feature"

# 2. Create release (updates version, merges to main, creates tag)
./scripts/mkrelease.sh 0.2.0 minor

# 3. Build and deploy to gh-pages
git checkout main
./scripts/mkbld.sh
git push origin gh-pages

# 4. Push tags and main branch
git push origin main
git push origin --tags

# 5. Create GitHub release
./scripts/mkghrelease.sh

# 6. Return to develop
git checkout develop
```

---

## Coding Guidelines

### TypeScript Best Practices

1. **Explicit Types**: Always define types for props and state
   ```typescript
   interface MainViewProps {
     onSaveCommute: (duration: number) => void;
     workLocation: Coordinates | null;
   }
   ```

2. **Type Inference**: Let TypeScript infer simple types
   ```typescript
   const formatTime = (totalSeconds: number) => {
     // Return type inferred as string
   };
   ```

3. **Strict Null Checks**: Handle null/undefined explicitly
   ```typescript
   if (workLocation) {
     // Safe to access workLocation properties
   }
   ```

### React Best Practices

1. **Functional Components**: Use function components with hooks
   ```typescript
   export const MainView: React.FC<MainViewProps> = ({ props }) => {
     // Component logic
   };
   ```

2. **Custom Hooks**: Extract reusable logic into hooks
   ```typescript
   const { isRunning, startTimer, stopTimer } = useCommuteTimer({ /* config */ });
   ```

3. **Memoization**: Use `useMemo` for expensive computations
   ```typescript
   const stats = useMemo(() => calculateStats(records), [records]);
   ```

4. **Effect Cleanup**: Always clean up side effects
   ```typescript
   useEffect(() => {
     const interval = setInterval(/* ... */);
     return () => clearInterval(interval);
   }, []);
   ```

### Code Organization

1. **File Structure**: One component per file
2. **Import Order**: React → libraries → local imports → types
3. **Component Order**: Interfaces → component → exports
4. **Naming Conventions**:
   - Components: PascalCase (`MainView.tsx`)
   - Hooks: camelCase with "use" prefix (`useCommuteTimer.ts`)
   - Services: camelCase with descriptive name (`statsService.ts`)
   - Types: PascalCase (`CommuteRecord`)

### Styling Conventions

1. **TailwindCSS**: Use utility classes directly
   ```tsx
   <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
   ```

2. **Responsive**: Mobile-first with breakpoint prefixes
   ```tsx
   <div className="text-sm md:text-base lg:text-lg">
   ```

3. **Consistent Spacing**: Use Tailwind spacing scale (4px units)

### Code Quality

1. **Linting**: Follow TypeScript and React best practices
2. **Error Handling**: Always handle errors gracefully
3. **Console Logs**: Remove debug logs before commit
4. **Comments**: Use JSDoc for complex functions
   ```typescript
   /**
    * Calculates distance between two GPS coordinates using Haversine formula
    * @param coord1 - First coordinate
    * @param coord2 - Second coordinate
    * @returns Distance in meters
    */
   ```

### Git Commit Messages

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(stats): Add confidence interval calculation
fix(timer): Prevent timer drift on page refresh
docs(readme): Update installation instructions
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/johan162/commute.git
cd commute

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Cycle

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **Develop and Test**
   ```bash
   npm run dev  # Run dev server
   # Make changes
   # Test in browser
   ```

3. **Build and Verify**
   ```bash
   npm run build  # Check for build errors
   npx tsc        # Check for TypeScript errors
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   ```

5. **Merge to Develop**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   ```

### Testing Checklist

Before creating a release:

- [ ] App builds without errors
- [ ] TypeScript compiles without errors
- [ ] All views render correctly
- [ ] Timer persists across page refresh
- [ ] GPS auto-stop works (with location permission)
- [ ] Statistics calculate correctly
- [ ] Export functions work (CSV/PDF)
- [ ] PWA installs on mobile device
- [ ] Works offline after installation
- [ ] Data persists in localStorage

### Debugging Tips

1. **Browser DevTools**: Use React DevTools extension
2. **Console**: Check for JavaScript errors and warnings
3. **Network**: Verify service worker registration
4. **Application Tab**: Inspect localStorage contents
5. **Location**: Enable GPS in browser for testing auto-stop

### Common Issues

**Issue**: Timer doesn't persist after refresh
- **Solution**: Check localStorage for `commuteStartTime` key

**Issue**: GPS auto-stop not working
- **Solution**: Ensure location permission granted, work location set

**Issue**: Build fails with TypeScript errors
- **Solution**: Run `npx tsc` to see detailed errors

**Issue**: PWA doesn't install
- **Solution**: Check manifest.json, serve over HTTPS, verify service worker

---

## Additional Resources

### Documentation Links

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

### Project Links

- **Repository**: https://github.com/johan162/commute
- **Live App**: https://johan162.github.io/commute
- **Issues**: https://github.com/johan162/commute/issues

---

## Contributing

When contributing to this project:

1. Follow the coding guidelines above
2. Write clear commit messages
3. Test thoroughly before submitting
4. Update documentation if needed
5. Create pull requests to `develop` branch

---

**Last Updated**: October 2025  
**Version**: 0.2.0  
**Maintainer**: johan162
