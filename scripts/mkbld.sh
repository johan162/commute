#!/bin/bash

# Build and Deploy Script for PWA to gh-pages branch
# This script builds the app and deploys it to the gh-pages branch

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting build and deploy process...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted by user${NC}"
        exit 1
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}Current branch: ${CURRENT_BRANCH}${NC}"

# Check if gh-pages branch exists
if ! git show-ref --verify --quiet refs/heads/gh-pages; then
    echo -e "${RED}Error: gh-pages branch does not exist${NC}"
    echo "Create it first with: git checkout --orphan gh-pages"
    exit 1
fi

# Clean previous build
echo -e "${GREEN}Cleaning previous build...${NC}"
rm -rf dist/

# Build the project
echo -e "${GREEN}Building project...${NC}"
if ! npm run build; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

# Check if dist directory exists and has content
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist directory not found${NC}"
    exit 1
fi

if [ -z "$(ls -A dist)" ]; then
    echo -e "${RED}Error: dist directory is empty${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Switch to gh-pages branch
echo -e "${GREEN}Switching to gh-pages branch...${NC}"
if ! git checkout gh-pages; then
    echo -e "${RED}Error: Failed to checkout gh-pages branch${NC}"
    exit 1
fi

# Remove old files (keep .git directory)
echo -e "${GREEN}Removing old files from gh-pages...${NC}"
git rm -rf assets *.svg *.html *.json manifest.* *.js  > /dev/null 2>&1 || true

# Copy new build files
echo -e "${GREEN}Copying new build files...${NC}"
cp -r dist/* .

# Create .nojekyll file (important for GitHub Pages)
touch .nojekyll

# Add all files
echo -e "${GREEN}Adding files to git...${NC}"
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to deploy${NC}"
    git checkout "$CURRENT_BRANCH"
    exit 0
fi

# Commit changes
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "Deploy build - $BUILD_DATE"

echo -e "${GREEN}Deployment committed successfully!${NC}"
echo -e "${YELLOW}To push to remote, run: git push origin gh-pages${NC}"

# Switch back to original branch
echo -e "${GREEN}Switching back to ${CURRENT_BRANCH}...${NC}"
git checkout "$CURRENT_BRANCH"

echo -e "${GREEN}Done! Build and deploy completed successfully.${NC}"
echo -e "${YELLOW}Remember to push: git push origin gh-pages${NC}"
