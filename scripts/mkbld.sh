#!/bin/bash

# Build and Deploy Script for PWA to gh-pages branch
# This script builds the app and deploys it to the gh-pages branch

set -eu # Exit on error, undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================
# CONFIGURATION
# =====================================

declare GITHUB_USER="johan162"
declare SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare PROGRAMNAME="commute"
declare PROGRAMNAME_PRETTY="Commute Tracker"

# Function to print colored output
log_info() {
    echo -e "${GREEN}    [INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️ [WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}🔄 [STEP $1]${NC} $2"
}

show_help() {
    cat <<EOF
🚀 ${PROGRAMNAME_PRETTY} ReleaBuild Script

DESCRIPTION:
    Build script for ${PROGRAMNAME_PRETTY} PWA.

USAGE:
    $0 [options]

OPTIONS:
    --deploy, -d    Deploy the built files to gh-pages branch
    --help, -h      Show this help message and exit
    --push, -p      Push changes in gh-pages branch to remote repository after build

EXAMPLES:
    # Show help
    $0 --help

    # Preview a minor release (recommended first step)
    $0 v2.1.0 minor

    # Execute a minor release
    $0 v2.1.0 minor

    # Create a major release
    $0 v3.0.0-rc1 major

REQUIREMENTS:
    • Must be run from project root directory
    • Must be on 'develop' branch with clean working directory

EOF
}

declare DEPLOY_AFTER_BUILD=false
declare PUSH_AFTER_BUILD=false

for arg in "$@"; do
    case $arg in
    --help | -h)
        show_help
        exit 0
        ;;
    --push | -p)
        PUSH_AFTER_BUILD=true
        shift
        ;;
    --deploy | -d)
        DEPLOY_AFTER_BUILD=true
        shift
        ;;
    -*)
        log_error "Unknown option: $arg"
        echo "Usage: $0 <version> [major|minor|patch] [--help]"
        echo "Run '$0 --help' for detailed information"
        exit 1
        ;;
    esac
done

echo -e "${BLUE}==== Commute Tracker Build Script ====${NC}"

# =====================================
# Step 1: Pre-build Checks
# =====================================

log_step 1 "Pre-build checks"

# Check if we're in a git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log_error "Not a git repository. Please run this script from the root of a git repository."
    exit 1
fi

if ! git diff-index --quiet HEAD --; then
    log_error "Working directory is not clean."
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Aborted by user"
        exit 1
    fi
fi

if [ -n "$(git status --porcelain)" ]; then
    log_error "There are untracked or staged files."
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Aborted by user"
        exit 1
    fi
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    log_warn "You have uncommitted changes in your working directory."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Aborted by user"
        exit 1
    fi
fi

# Get current branch
ORIGINAL_BRANCH=$(git branch --show-current)
log_info "Current branch: $ORIGINAL_BRANCH"

# Check if gh-pages branch exists
if ! git show-ref --verify --quiet refs/heads/gh-pages; then
    log_error "gh-pages branch does not exist"
    echo "Create it first with: git checkout --orphan gh-pages"
    exit 1
fi

# =====================================
# Step 2: Build Project, check types, run tests
# =====================================

# --------------------------------------
# Step 2.1: Build Project
# --------------------------------------
log_step 2 "Building project..."

# Clean previous build
log_info "Cleaning previous build..."
rm -rf dist/

# Build the project
log_info "Building project..."
if ! npm run build >/dev/null 2>&1; then
    log_error "Build failed. Run 'npm run build' manually to see errors."
    exit 1
fi

# Check if dist directory exists and has content
if [ ! -d "dist" ]; then
    log_error "dist directory not found"
    exit 1
fi

if [ -z "$(ls -A dist)" ]; then
    log_error "dist directory is empty"
    exit 1
fi

log_info "Build successful!"

# --------------------------------------
# Step 2.1: Type Check
# --------------------------------------
log_step 2.1 "Typescript type check..."
if ! npx tsc --noEmit --strict >/dev/null 2>&1; then
    log_error "Type check failed. Run 'npm run type-check' manually to see errors."
    exit 1
fi
log_info "Type check passed!"

# --------------------------------------
# Step 2.2: Check test coverage meets minimum threshold
# --------------------------------------
log_step 2.2 "Checking test coverage..."

COVERAGE_THRESHOLD=75
log_info "Required coverage threshold: ${COVERAGE_THRESHOLD}%"

# Run tests with coverage and capture output
COVERAGE_OUTPUT=$(npm run test:coverage 2>&1)

# Extract coverage percentages from the output
# Looking for the "All files" line which contains overall coverage
COVERAGE_LINE=$(echo "$COVERAGE_OUTPUT" | grep "All files" | head -1)

if [ -z "$COVERAGE_LINE" ]; then
    log_error "Could not extract coverage information from test output"
    log_error "Please ensure 'npm run test:coverage' produces coverage report"
    exit 1
fi

# Extract the percentage values (Statements, Branch, Functions, Lines)
# Format: "All files     |   92.7 |    84.05 |     100 |   93.72 |"
STMT_COV=$(echo "$COVERAGE_LINE" | awk '{print $4}' | cut -d'|' -f1 | xargs)
BRANCH_COV=$(echo "$COVERAGE_LINE" | awk '{print $6}' | cut -d'|' -f1 | xargs)
FUNC_COV=$(echo "$COVERAGE_LINE" | awk '{print $8}' | cut -d'|' -f1 | xargs)
LINE_COV=$(echo "$COVERAGE_LINE" | awk '{print $10}' | cut -d'|' -f1 | xargs)

log_info "Coverage Report:"
log_info "  Statements: ${STMT_COV}%"
log_info "  Branches:   ${BRANCH_COV}%"
log_info "  Functions:  ${FUNC_COV}%"
log_info "  Lines:      ${LINE_COV}%"

# Check if any metric is below threshold
COVERAGE_FAILED=0

if (( $(echo "$STMT_COV < $COVERAGE_THRESHOLD" | bc -l) )); then
    log_error "Statement coverage (${STMT_COV}%) is below threshold (${COVERAGE_THRESHOLD}%)"
    COVERAGE_FAILED=1
fi

if (( $(echo "$BRANCH_COV < $COVERAGE_THRESHOLD" | bc -l) )); then
    log_error "Branch coverage (${BRANCH_COV}%) is below threshold (${COVERAGE_THRESHOLD}%)"
    COVERAGE_FAILED=1
fi

if (( $(echo "$FUNC_COV < $COVERAGE_THRESHOLD" | bc -l) )); then
    log_error "Function coverage (${FUNC_COV}%) is below threshold (${COVERAGE_THRESHOLD}%)"
    COVERAGE_FAILED=1
fi

if (( $(echo "$LINE_COV < $COVERAGE_THRESHOLD" | bc -l) )); then
    log_error "Line coverage (${LINE_COV}%) is below threshold (${COVERAGE_THRESHOLD}%)"
    COVERAGE_FAILED=1
fi

if [ $COVERAGE_FAILED -eq 1 ]; then
    log_error "Test coverage is below minimum threshold of ${COVERAGE_THRESHOLD}%"
    log_error "Please add more tests to increase coverage before creating a release"
    exit 1
fi

log_info "✓ Test coverage meets minimum threshold (${COVERAGE_THRESHOLD}%)"   


# =====================================
# Step 3: Deploy to gh-pages
# =====================================
log_step 3 "Checking if we should deploy to gh-pages branch."

if [ "${DEPLOY_AFTER_BUILD}" != true ]; then
    log_info "Skipping deployment to gh-pages branch (not requested)"
else
    log_info "Deploying to gh-pages branch..."
    
    # Switch to gh-pages branch
    log_info "Switching to gh-pages branch..."
    if ! git checkout gh-pages; then
        log_error "Failed to checkout gh-pages branch"
        exit 1
    fi

    # Remove old files (keep .git & .gitignore in directory)
    log_info "Removing old deployment files from gh-pages..."
    git rm -rf assets *.svg *.html *.json manifest.* *.js >/dev/null 2>&1 || true

    # Copy new build files
    log_info "Copying new build files..."
    cp -r dist/* .

    # Create .nojekyll file (important for GitHub Pages)
    touch .nojekyll

    # Add all files
    log_info "Adding files to git..."
    git add .

    # Check if there are changes to commit
    if git diff --cached --quiet; then
        log_warn "No changes to deploy. Exiting."
        git checkout "$ORIGINAL_BRANCH"
        exit 0
    fi

    # Commit changes
    BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
    log_info "Committing changes..."
    git commit -m "Deploy build - $BUILD_DATE"

    log_info "Deployment committed successfully!"

    # Push to gh-pages branch
    if [ "$PUSH_AFTER_BUILD" = true ]; then
        log_info "Pushing to remote gh-pages branch..."
        if git push origin gh-pages; then
            log_info "Pushed to remote gh-pages branch successfully!"
        else
            log_error "Failed to push to remote gh-pages branch. You may need to push manually: git push origin gh-pages"
            exit 1
        fi
    else
        log_info "Skipping push to remote gh-pages branch (not requested)"
    fi
fi

# =====================================
# Step 4: Cleanup and Return
# =====================================

log_step 4 "Cleaning up..."

if [ "$(git branch --show-current)" != "$ORIGINAL_BRANCH" ]; then
    # Switch back to original branch
    log_info "Switching back to $ORIGINAL_BRANCH..."
    git checkout "$ORIGINAL_BRANCH"
fi

log_info "Done! Build and deploy completed successfully."

# End of script
