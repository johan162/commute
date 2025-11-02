#!/bin/bash

# Script to fetch all remote branches and update local branches that have upstream counterparts

set -euo pipefail # Exit on any error

# =====================================
# HELPER FUNCTIONS
# =====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions to print colored output
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

log_success() {
    echo -e "${GREEN}✅ [SUCCESS!] $1${NC}"
}

# ----------------------------------
# Step 1: Pre-requisites
# ----------------------------------

# Check if we're in a git repository
log_step 1 "Checking if in a git repository"
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
fi

# Get current branch
ORIGINAL_BRANCH=$(git branch --show-current)
log_info "Current branch: $ORIGINAL_BRANCH"

# Check that the directory is clean (no uncommitted changes)
if ! git diff-index --quiet HEAD -- || [[ -n $(git status --porcelain) ]]; then
    log_error "You have uncommitted changes or untracked files in your current working directory."
    git status --short
    exit 1
fi

# ----------------------------------
# Step 2: Fetch all remote branches
# ----------------------------------

log_step 2 "Fetching all remote branches..."

if git fetch --all; then
    log_info "Fetched all remote branches successfully."
else
    log_error "Failed to fetch remote branches."
    exit 1
fi

# ----------------------------------
# Step 3: Update corresponding local branches
# ----------------------------------

log_step 3 "Updating local branches with upstream counterparts..."

# Disable filename expansion (globbing)
# This is important as the current branch will be '*' !
set -f

# Get list of local branches that have upstream remotes as a bash array
local_branches=($(git branch -vv | grep -E '\[origin/' | awk '{print $1}'))

if [ -z "$local_branches" ]; then
    log_warn "No local branches with upstream remotes found. Exiting."
    exit 0
fi

for branch in "${local_branches[@]}"; do
    # If the branch is '*' then replace it with the name of the ORIGINAL_BRANCH
    if [ "$branch" == "*" ]; then
        branch="$ORIGINAL_BRANCH"
    fi
    if git checkout "$branch"; then
        log_info "Checked out branch: $branch"
    else
        log_error "Failed to checkout branch: $branch"
        exit 1
    fi
    if git pull; then
        log_info "Updated branch: $branch"
    else
        log_error "Failed to update branch: $branch"
        exit 1
    fi
done

# Return to original branch
if [ -n "$ORIGINAL_BRANCH" ]; then
    if git checkout "$ORIGINAL_BRANCH"; then
        log_info "Returned to original branch: $ORIGINAL_BRANCH"
    else
        log_error "Failed to return to original branch: $ORIGINAL_BRANCH"
        exit 1
    fi
fi

# ----------------------------------
# Step 4: Final message
# ----------------------------------

log_success "All branches (${local_branches}) updated successfully."

# End of script
