#!/bin/bash

# Build and Deploy Script for PWA to gh-pages branch
# This script builds the app and deploys it to the gh-pages branch

set -eu  # Exit on error, undefined variables

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
    cat << EOF
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
        --help|-h)
            show_help
            exit 0
            ;;
        --push|-p)
            PUSH_AFTER_BUILD=true
            shift
            ;;
        --deploy|-d)
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
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository. Please run this script from the root of a git repository."
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
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
# Step 2: Build Project
# =====================================

log_step 2 "Building project..."

# Clean previous build
log_info "Cleaning previous build..."
rm -rf dist/

# Build the project
log_info "Building project..."
if ! npm run build; then
    log_error "Build failed"
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

# =====================================
# Step 3: Deploy to gh-pages
# =====================================

if [ "${DEPLOY_AFTER_BUILD}" != true ]; then
    log_info "Skipping deployment to gh-pages branch (not requested)"
else
    log_step 3 "Deploying to gh-pages branch..."

    # Switch to gh-pages branch
    log_info "Switching to gh-pages branch..."
    if ! git checkout gh-pages; then
        log_error "Failed to checkout gh-pages branch"
        exit 1
    fi

    # Remove old files (keep .git & .gitignore in directory)
    log_info "Removing old deployment files from gh-pages..."
    git rm -rf assets *.svg *.html *.json manifest.* *.js  > /dev/null 2>&1 || true

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
