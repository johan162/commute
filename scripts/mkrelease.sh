#!/bin/bash

# Release Script for Commute Tracker
# Usage: ./scripts/mkrelease.sh <version>
# Example: ./scripts/mkrelease.sh 0.2.0

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
    echo -e "${BLUE}🔄 [STEP]${NC} $1"
}

# Function to validate semantic version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "Invalid version format. Expected: x.y.z (e.g., 0.1.0). Only numeric versions allowed."
        exit 1
    fi
}

# Function to cleanup on exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_warn "Script failed. You may need to manually clean up any changes."
        log_warn "Current branch: $(git branch --show-current)"
    fi
    exit $exit_code
}

show_help() {
    cat << EOF
🚀 ${PROGRAMNAME_PRETTY} Release Script

DESCRIPTION:
    Automated release script for ${PROGRAMNAME_PRETTY} with comprehensive quality gates.
    Performs validation, testing, versioning, and git operations for releases.

USAGE:
    $0 <version> [release-type] [options]

ARGUMENTS:
    version         Semantic version number (e.g., 2.1.0, 1.0.0, 0.9.1)
                    Must follow semver format: MAJOR.MINOR.PATCH

    release-type    Type of release (default: minor)
                    • major   - Breaking changes, incompatible API changes
                    • minor   - New features, backwards compatible  
                    • patch   - Bug fixes, backwards compatible

OPTIONS:
    --help, -h      Show this help message and exit

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


trap cleanup EXIT

# Main script starts here
echo -e "${BLUE}=== Commute Tracker Release Script ===${NC}"


# Parse arguments
declare VERSION=""
declare RELEASE_TYPE="minor"

for arg in "$@"; do
    case $arg in
        --help|-h)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $arg"
            echo "Usage: $0 <version> [major|minor|patch] [--help]"
            echo "Run '$0 --help' for detailed information"
            exit 1
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$arg"
            else
                RELEASE_TYPE="$arg"
            fi
            shift
            ;;
    esac
done

if [[ -z "$VERSION" ]]; then
    log_error "Error: Version required"
    echo ""
    echo "Usage: $0 <version> [major|minor|patch] [--help]"
    echo ""
    echo "Examples:"
    echo "  $0 2.1.0 minor"
    echo "  $0 2.1.0 minor"
    echo "  $0 --help"
    echo ""
    echo "Run '$0 --help' for detailed information"
    exit 1
fi

validate_version "$VERSION"
log_info "Creating release for version: $VERSION"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository"
    exit 1
fi

# ===============================================================
# Step 1: Check that we are on develop branch
# ===============================================================
log_step "1. Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    log_error "Must be on 'develop' branch. Currently on: $CURRENT_BRANCH"
    exit 1
fi
log_info "✓ On develop branch"

# ===============================================================
# Step 2: Check that the version does not already exist as a tag
# ===============================================================
log_step "2. Checking if tag already exists..."
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    log_error "Tag v$VERSION already exists"
    exit 1
fi
log_info "✓ Tag v$VERSION does not exist"

# ===============================================================
# Step 3: Check that the branch is clean and no commits are waiting
# ===============================================================
log_step "3. Checking git status..."
if ! git diff-index --quiet HEAD --; then
    log_error "Working directory is not clean. Please commit or stash your changes."
    git status --short
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    log_error "There are untracked or staged files. Please commit or remove them."
    git status --short
    exit 1
fi
log_info "✓ Working directory is clean"

# ===============================================================
# Step 4: Check that a build can be made without errors
# ===============================================================
log_step "4. Testing build..."
if ! npm run build > /dev/null 2>&1; then
    log_error "Build failed. Please fix build errors before creating a release."
    exit 1
fi
log_info "✓ Build successful"

# ===============================================================
# Step 5: Update the version number string in src/App.tsx and README.md
# ===============================================================
log_step "5. Updating version in src/App.tsx..."
if [ ! -f "src/App.tsx" ]; then
    log_error "src/App.tsx not found"
    exit 1
fi

# Create backup
cp src/App.tsx src/App.tsx.bak

# Update version using sed
if sed -i.tmp "s/const version = '[^']*';/const version = '$VERSION';/g" src/App.tsx; then
    rm -f src/App.tsx.tmp
    rm -f src/App.tsx.bak
    log_info "✓ Version updated to $VERSION in src/App.tsx"
else
    # Restore backup if sed failed
    mv src/App.tsx.bak src/App.tsx
    log_error "Failed to update version in src/App.tsx"
    exit 1
fi

# Verify the change was made
if ! grep -q "const version = '$VERSION';" src/App.tsx; then
    log_error "Version update verification failed"
    exit 1
fi

# --------------------------------------------------------------
# Step 5.1: Update version number in badge in README.md
# --------------------------------------------------------------
log_step "5.1 Updating version badge in README.md..."
if [ ! -f "README.md" ]; then
    log_error "README.md not found"
    exit 1
fi
# ![Version](https://img.shields.io/badge/version-0.2.0-brightgreen.svg)
# Update version badge using sed
if sed -i.tmp -E "s/badge\/version-[0-9]+\.[0-9]+\.[0-9]+/badge\/version-$VERSION/g" README.md; then
    rm -f README.md.tmp
    log_info "✓ Version badge updated to $VERSION in README.md"
else
    rm -f README.md.tmp
    log_error "Failed to update version badge in README.md"
    exit 1
fi
# Verify the change was made
if ! grep -q "badge/version-$VERSION" README.md; then
    log_error "Version badge update verification failed"
    exit 1
fi

# --------------------------------------------------------------
# Step 5.2: Updated CHANGELOG.md
# --------------------------------------------------------------
log_step "5.2 Updating CHANGELOG.md..."
    echo "  ✓ Preparing changelog..."
    CHANGELOG_DATE=$(date +%Y-%m-%d)

    # Create temporary changelog entry 
    cat > CHANGELOG_ENTRY.tmp << EOF
## [$VERSION] - $CHANGELOG_DATE

Release type: $RELEASE_TYPE

### 📋 Summary 
- [Brief summary of the release]

### ✨ Additions
- [List new features added in this release]

### 🚀 Improvements
- [List improvements made in this release]

### 🐛 Bug Fixes
- [List bug fixes addressed in this release]

### 🛠 Internal
- [List internal changes, refactoring, etc.]

EOF

# Prepend to existing CHANGELOG.md (create if doesn't exist)
if [[ -f CHANGELOG.md ]]; then
    cat CHANGELOG_ENTRY.tmp CHANGELOG.md > CHANGELOG_NEW.tmp
    mv CHANGELOG_NEW.tmp CHANGELOG.md
else
    mv CHANGELOG_ENTRY.tmp CHANGELOG.md
fi
rm -f CHANGELOG_ENTRY.tmp

echo ""
echo "⚠️  PLEASE EDIT CHANGELOG.md to add specific release notes"
echo "   Press Enter when changelog is ready, or Ctrl+C to abort"
read -r


# ===============================================================
# Step 6: Stage and commit the updated src/App.tsx and CHANGELOG.md files
# ===============================================================
log_step "6. Committing version update and CHANGELOG.md..."

git add src/App.tsx CHANGELOG.md README.md
git commit -m "Bump version to $VERSION on develop branch"
log_info "✓ Version update committed to develop"

# ===============================================================
# Step 7: Switch to main branch
# ===============================================================
log_step "8. Switching to main branch..."

if ! git checkout main; then
    log_error "Failed to checkout main branch. Directory dirty?"
    exit 1
fi
log_info "✓ Switched to main branch"

# ===============================================================
# Step 9: Squash merge develop to main branch
# ===============================================================
log_step "9. Merging develop to main..."

if ! git merge --squash develop; then
    log_error "Failed to squash merge develop to main"
    log_warn "You may need to resolve conflicts manually"
    exit 1
fi

# Commit the squash merge
git commit -m "Release: v$VERSION"
log_info "✓ Merged develop to main with release commit"

# ===============================================================
# Step 7: Tag the branch with the release version
# ===============================================================
log_step "7. Creating release tag on main..."

CHANGELOG_DATE=$(date +%Y-%m-%d)
git tag -a "v$VERSION" -m "Release version $VERSION

Release Type: $RELEASE_TYPE
Release Date: $CHANGELOG_DATE
Changelog: See CHANGELOG.md for detailed changes"

git push origin main
git push origin "v$VERSION"
log_info "✓ Created tag v$VERSION on main branch"

# ===============================================================
# Step 10: Build and deploy to gh-pages using existing script
# ===============================================================
log_step "10. Building and deploying to gh-pages..."
if [ ! -f "scripts/mkbld.sh" ]; then
    log_error "scripts/mkbld.sh not found"
    exit 1
fi

if ! bash scripts/mkbld.sh --deploy; then
    log_error "Failed to build and deploy to gh-pages"
    exit 1
fi
log_info "✓ Built and deployed to gh-pages"

log_info "Pushing gh-pages branch..."
git push origin gh-pages

# ===============================================================
# Step 11: Switch back to develop branch
# ===============================================================
log_step "11. Switching back to develop branch..."
git checkout develop
log_info "✓ Switched back to develop branch"

# Merge main into develop to reconcile squash merge
log_info "Merging main into develop..."
git merge --no-ff -m "chore: sync develop with main after release $VERSION" main
git push origin develop


# ==============================================================
# Step 12: Create build artifacts by compressing dist/ directory
# ==============================================================
log_step "12. Creating build artifacts..."

if [ ! -d "dist" ]; then
    log_error "dist directory not found"
    exit 1
fi

# Check that zip command is available
if ! command -v zip >/dev/null 2>&1; then
    log_error "zip command not found. Please install zip utility."
    exit 1
fi

FILE_VERSION_NUMBER=${VERSION_NUMBER//-rc/rc}
ARTIFACT_NAME="${PROGRAMNAME}-${FILE_VERSION_NUMBER}-dist.zip"
cd dist
if zip -r "../${ARTIFACT_NAME}" . > /dev/null 2>&1; then
    cd ..
    print_sub_step "Validating artifact sizes..."
    ARTIFACT_SIZE=$(stat -f%z "${ARTIFACT_NAME}" 2>/dev/null || stat -c%s "${ARTIFACT_NAME}" 2>/dev/null)
    if [ ! -f "${ARTIFACT_NAME}" ] || [ ! -s "${ARTIFACT_NAME}" ] ; then
        log_error "Build artifact creation failed"
        exit 1
    fi
    if [[ "$ARTIFACT_SIZE" -lt 8192 ]]; then
        print_error "Distribution artifact suspiciously small: $ARTIFACT_SIZE bytes"
        exit 1
    fi
    log_info "✓ Created build artifact: ${ARTIFACT_NAME}"
else
    cd ..
    log_error "Failed to create build artifact"
    exit 1
fi

# ===============================================================
# Step 13: Print summary and next steps
# ===============================================================
echo ""
echo -e "${GREEN}=== Release v$VERSION completed successfully! ===${NC}"
echo ""
echo "Summary of actions performed:"
echo "  ✓ Updated version in src/App.tsx to $VERSION"
echo "  ✓ Created commit with version bump on develop"
echo "  ✓ Created tag v$VERSION"
echo "  ✓ Squash merged develop to main"
echo "  ✓ Built and deployed to gh-pages"
echo "  ✓ Pushed all changes to remote"
echo ""
echo "Next steps:"
echo "  - Verify the deployment at your GitHub Pages URL"
echo "  - Create a GitHub release from the v$VERSION tag if desired"
echo "  - Continue development on the develop branch"
echo ""

# End of script
