#!/bin/bash

# mkghrelease.sh - Create GitHub release using gh CLI
#
# This script should be run AFTER mkrelease.sh has completed successfully
# and all GitHub workflows have finished.
#
# Usage: ./scripts/mkghrelease.sh [OPTIONS]
#
# Options:
#   --help          Show this help message
#   --pre-release   Force marking the release as a pre-release
#   --dry-run       Show commands without executing them

set -eu   # Exit on error, undefined variables

# =====================================
# COLOR CODES
# =====================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =====================================
# CONFIGURATION
# =====================================

declare GITHUB_USER="johan162"
declare SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare PROGRAMNAME="commute"
declare PROGRAMNAME_PRETTY="Commute Tracker"


declare REQUIRED_GH_VERSION="2.0.0"
declare DIST_DIR="dist"
declare CHANGELOG_FILE="CHANGELOG.md"
declare RELEASE_NOTES_FILE=".github_release_notes.tmp"

# =====================================
# COMMAND LINE OPTIONS
# =====================================

DRY_RUN=false
FORCE_PRE_RELEASE=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --pre-release)
            FORCE_PRE_RELEASE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done


# =====================================
# Functions to print colored output
# =====================================
print_step() {
    echo -e "${BLUE}==>${NC} ${1}"
}

print_step_colored() {
    echo -e "${BLUE}==> ${1}${NC}"
}

print_sub_step() {
    echo -e "${BLUE}  ->${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ Success: ${1}${NC}"
}

print_success_colored() {
    if [ "$CI_MODE" = true ]; then
        echo -e "✓ Success: ${1}"
    else
        echo -e "${GREEN}✅ Success: ${1}${NC}"
    fi
}

print_error() {
    echo -e "${RED}✗ Error: ${NC} ${1}" >&2
}

print_error_colored() {
    if [ "$CI_MODE" = true ]; then
        echo -e "✗ Error: ${1}"
    else
        echo -e "${RED}❌ Error: ${1}${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠ Warning:${NC} ${1}"
}

print_warning_colored() {
    if [ "$CI_MODE" = true ]; then
        echo -e "⚠ Warning: ${1}"
    else
        echo -e "${YELLOW}⚠️  Warning: ${1}${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_info_colored() {
    if [ "$CI_MODE" = true ]; then
        echo -e "ℹ $1"
    else
        echo -e "${BLUE}ℹ️  ${1}${NC}"
    fi
}

show_help() {
    cat << EOF
🚀 GitHub Release Creator for ${PROGRAMNAME_PRETTY}

DESCRIPTION:
    Creates a GitHub release using the gh CLI tool. This script should be run
    AFTER mkrelease.sh has completed successfully and all optional GitHub Actions
    workflows have finished.

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --help          Show this help message and exit
    --pre-release   Force the release to be marked as a pre-release
                    (overrides automatic detection based on tag name)
    --dry-run       Show what commands would be executed without actually
                    running them

PREREQUISITES:
    1. GitHub CLI (gh) version ${REQUIRED_GH_VERSION} or higher installed
    2. Authenticated with GitHub (gh auth login)
    3. mkrelease.sh completed successfully
    4. All GitHub Actions workflows completed
    5. On the 'main' branch with latest tag pushed

AUTOMATIC PRE-RELEASE DETECTION:
    If --pre-release is NOT specified, the script automatically determines
    pre-release status based on the tag name:

    - Tags ending with -rc1, -rc2, etc. → Pre-release
    - All other tags (e.g., v1.0.0)     → Stable release

WHAT THIS SCRIPT DOES:
    1. Validates gh CLI is installed and authenticated
    2. Checks that no workflows are currently running
    3. Identifies the latest tag on main branch
    4. Validates tag format (vX.Y.Z or vX.Y.Z-rcN)
    5. Extracts release notes from CHANGELOG.md
    6. Opens editor for you to review/edit release notes
    7. Validates artifacts in dist/ directory
    8. Creates GitHub release with artifacts
    9. Cleans up temporary files

EXAMPLES:
    # Create a stable release (tag: v1.0.0)
    $0

    # Create a release candidate (tag: v1.0.0-rc1)
    $0

    # Force as pre-release regardless of tag
    $0 --pre-release

    # Preview what would be done
    $0 --dry-run

SEE ALSO:
    - scripts/mkrelease.sh    (Run this first to create the release)
    - scripts/mkbld.sh        (Build and test the package)

EOF
}

# =====================================
# HELPER FUNCTIONS
# =====================================

check_command_exists() {
    local cmd=$1
    if ! command -v "$cmd" &> /dev/null; then
        print_error "$cmd is not installed"
        return 1
    fi
    return 0
}

compare_versions() {
    # Compare two semantic versions
    # Returns: 0 if $1 >= $2, 1 otherwise
    local ver1=$1
    local ver2=$2

    if [[ "$ver1" == "$ver2" ]]; then
        return 0
    fi

    local IFS=.
    local i ver1_array=($ver1) ver2_array=($ver2)

    # Fill empty positions with zeros
    for ((i=${#ver1_array[@]}; i<${#ver2_array[@]}; i++)); do
        ver1_array[i]=0
    done

    for ((i=0; i<${#ver1_array[@]}; i++)); do
        if [[ -z ${ver2_array[i]} ]]; then
            ver2_array[i]=0
        fi
        if ((10#${ver1_array[i]} > 10#${ver2_array[i]})); then
            return 0
        fi
        if ((10#${ver1_array[i]} < 10#${ver2_array[i]})); then
            return 1
        fi
    done
    return 0
}

run_command() {
    local cmd=$1
    local description=$2

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "[DRY-RUN] Would execute: $cmd"
        if [[ -n "$description" ]]; then
            echo "  Description: $description"
        fi
        return 0
    else
        if [[ -n "$description" ]]; then
            print_sub_step "$description"
        fi
        if eval "$cmd"; then
            return 0
        else
            print_error_colored "$description failed"
            return 1
        fi
    fi
}

# =====================================
# MAIN SCRIPT
# =====================================

echo ""
echo "=========================================="
echo "  GitHub Release Creator for ${PROGRAMNAME_PRETTY}"
echo "=========================================="
echo "Repository: ${PROGRAMNAME}"
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"
if [[ "$DRY_RUN" == "true" ]]; then
    print_warning "DRY-RUN MODE: Commands will be printed but not executed"
fi
if [[ "$FORCE_PRE_RELEASE" == "true" ]]; then
    print_info "Pre-release mode: FORCED"
fi
echo ""

# =====================================
# PHASE 1: PREREQUISITES CHECK
# =====================================

print_step_colored ""
print_step_colored "🔍 PHASE 1: Prerequisites Check"
print_step_colored ""

# Check if we're in the root directory (LICENSE must exist)
run_command "test -f LICENSE" "Build script must be run from project root."

# 1.1: Check if gh CLI is installed
print_sub_step "Checking for GitHub CLI (gh)..."
if ! check_command_exists gh; then
    print_error "GitHub CLI (gh) is not installed"
    echo ""
    echo "Install instructions:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   See https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  Windows: See https://github.com/cli/cli#installation"
    exit 1
fi
print_success "GitHub CLI found: $(gh --version | head -1)"

# 1.2: Check gh version
print_sub_step "Checking gh version..."
GH_VERSION=$(gh --version | head -1 | awk '{print $3}')
if ! compare_versions "$GH_VERSION" "$REQUIRED_GH_VERSION"; then
    print_error "GitHub CLI version $GH_VERSION is too old (need >= $REQUIRED_GH_VERSION)"
    echo "Update with: brew upgrade gh (macOS) or see https://github.com/cli/cli#installation"
    exit 1
fi
print_success "Version $GH_VERSION meets requirements"

# 1.3: Check gh authentication
print_sub_step "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub"
    echo ""
    echo "Please authenticate with: gh auth login"
    echo "Then run this script again"
    exit 1
fi
print_success "Authenticated with GitHub"

# 1.4: Verify we're on main branch
print_sub_step "Verifying branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_error "Must be on 'main' branch (currently on '$CURRENT_BRANCH')"
    echo "Run: git checkout main"
    exit 1
fi
print_success "On main branch"

# 1.5: Check for uncommitted changes
print_sub_step "Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
    print_error "Working directory has uncommitted changes"
    echo ""
    git status --short
    echo ""
    echo "Commit or stash changes before creating release"
    exit 1
fi
print_success "Working directory clean"

# 1.6: Check if we're up to date with remote
print_sub_step "Checking sync with remote..."
git fetch origin main --quiet
LOCAL_COMMIT=$(git rev-parse main)
REMOTE_COMMIT=$(git rev-parse origin/main)
if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
    print_error "Local main branch is not in sync with origin/main"
    echo "Local:  $LOCAL_COMMIT"
    echo "Remote: $REMOTE_COMMIT"
    echo ""
    echo "Run: git pull origin main"
    exit 1
fi
print_success "In sync with origin/main"

# =====================================
# PHASE 2: WORKFLOW STATUS CHECK
# =====================================

echo ""
print_step_colored ""
print_step_colored "⚙️  PHASE 2: GitHub Workflows Check"
print_step_colored ""

print_sub_step "Checking for running workflows..."
RUNNING_WORKFLOWS=$(gh run list --branch main --limit 5 --json status,conclusion | jq -r '.[] | select(.status=="in_progress" or .status=="queued") | .status' | wc -l)

if [[ "$RUNNING_WORKFLOWS" -gt 0 ]]; then
    print_error "There are $RUNNING_WORKFLOWS workflow(s) currently running on main branch"
    echo ""
    echo "Running workflows:"
    gh run list --branch main --limit 4
    echo ""
    echo "Wait for workflows to complete before creating release"
    echo "Check status: gh run list --branch main --limit 4"
    exit 1
fi
print_success "No workflows currently running"

print_sub_step "Checking latest workflow status..."
LATEST_WORKFLOW_STATUS=$(gh run list --branch main --limit 1 --json conclusion | jq -r '.[0].conclusion')
if [[ "$LATEST_WORKFLOW_STATUS" != "success" ]]; then
    print_error "Latest workflow did not succeed (status: $LATEST_WORKFLOW_STATUS)"
    echo ""
    echo "Recent runs:"
    gh run list --branch main --limit 5
    echo ""
    echo "Fix workflow failures before creating release"
    exit 1
fi
print_success "Latest workflow succeeded"

# =====================================
# PHASE 3: VERSION VALIDATION
# =====================================

echo ""
print_step_colored ""
print_step_colored "🏷️  PHASE 3: Version Validation"
print_step_colored ""

# 3.1: Get latest tag
print_sub_step "Getting latest tag on main branch..."
LATEST_TAG=$(git describe --tags --abbrev=0 main 2>/dev/null || echo "")
if [[ -z "$LATEST_TAG" ]]; then
    print_error "No tags found on main branch"
    echo "Run mkrelease.sh first to create a release tag"
    exit 1
fi
print_success "Latest tag: $LATEST_TAG"

# 3.2: Validate tag format
print_sub_step "Validating tag format..."
if [[ ! "$LATEST_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-rc[0-9]{1,2})?$ ]]; then
    print_error "Invalid tag format: $LATEST_TAG"
    echo "Expected format: vX.Y.Z or vX.Y.Z-rcN"
    echo "Examples: v1.0.0, v2.1.3-rc1, v1.5.0-rc12"
    exit 1
fi
print_success "Tag format valid"

# 3.3: Determine if pre-release
print_sub_step "Determining release type..."
IS_PRE_RELEASE=false
if [[ "$FORCE_PRE_RELEASE" == "true" ]]; then
    IS_PRE_RELEASE=true
    RELEASE_TYPE="pre-release (forced)"
elif [[ "$LATEST_TAG" =~ -rc[0-9]+$ ]]; then
    IS_PRE_RELEASE=true
    RELEASE_TYPE="pre-release (auto-detected from tag)"
else
    IS_PRE_RELEASE=false
    RELEASE_TYPE="stable release"
fi
print_success "Release type: $RELEASE_TYPE"

# 3.4: Check if release already exists
print_sub_step "Checking if release already exists..."
if gh release view "$LATEST_TAG" &> /dev/null; then
    print_error "Release $LATEST_TAG already exists on GitHub"
    echo ""
    echo "View release: gh release view $LATEST_TAG"
    echo "Delete release: gh release delete $LATEST_TAG"
    echo ""
    exit 1
fi
print_success "Release does not exist yet"

# =====================================
# PHASE 4: ARTIFACTS VALIDATION
# =====================================

echo ""
print_step_colored ""
print_step_colored "📦 PHASE 4: Artifacts Validation"
print_step_colored ""

# 4.1: Check dist directory exists
print_sub_step "Checking dist directory..."
if [[ ! -d "$DIST_DIR" ]]; then
    print_error "${DIST_DIR} directory not found"
    echo "Run mkrelease.sh first to build the package"
    exit 1
fi
print_success "${DIST_DIR} directory exists"

# 4.2: Extract version from tag (without 'v' prefix)
VERSION_NUMBER=${LATEST_TAG#v}

# 4.3: Find expected artifacts

# Strip the '-' from the version for pre-releases
FILE_VERSION_NUMBER=${VERSION_NUMBER//-rc/rc}
ARTIFACT_NAME="${PROGRAMNAME}-${FILE_VERSION_NUMBER}-dist.zip"

print_sub_step "Locating artifacts with version $FILE_VERSION_NUMBER..."

if [[ ! -f "${ARTIFACT_NAME}" ]]; then
    print_error "Source distribution not found for version $VERSION_NUMBER"
    echo "Expected: ${ARTIFACT_NAME} in root"
    exit 1
fi

# 4.4: Validate artifact sizes
print_sub_step "Validating artifact sizes..."
ARTIFACT_SIZE=$(stat -f%z "${ARTIFACT_NAME}" 2>/dev/null || stat -c%s "${ARTIFACT_NAME}" 2>/dev/null)
if [[ "$ARTIFACT_SIZE" -lt 8192 ]]; then
    print_error "Distribution artifact suspiciously small: $ARTIFACT_SIZE bytes"
    exit 1
fi

print_success "Found artifact: $(basename "${ARTIFACT_NAME}")"
print_success "Artifact size: $(numfmt --to=iec-i --suffix=B "$ARTIFACT_SIZE" 2>/dev/null || echo "$ARTIFACT_SIZE bytes")"

# =====================================
# PHASE 5: RELEASE NOTES PREPARATION
# =====================================

echo ""
print_step_colored ""
print_step_colored "📝 PHASE 5: Release Notes Preparation"
print_step_colored ""

# 5.1: Extract release notes from CHANGELOG.md
print_sub_step "Extracting release notes from CHANGELOG.md..."
if [[ ! -f "$CHANGELOG_FILE" ]]; then
    print_error "CHANGELOG.md not found"
    exit 1
fi

# Extract the section for this version from CHANGELOG.md
# Looks for ## [$VERSION] and captures until next ## or EOF
sed -n "/^## \[$LATEST_TAG\]/,/^## \[/p" "$CHANGELOG_FILE" | sed '$d' > "$RELEASE_NOTES_FILE"

EXTRACT_STATUS=$?

if [[ $EXTRACT_STATUS -ne 0 ]] || [[ ! -s "$RELEASE_NOTES_FILE" ]]; then
    print_warning "Could not extract release notes for $LATEST_TAG from CHANGELOG.md"
    echo "Creating default release notes template..."
    cat > "$RELEASE_NOTES_FILE" << EOF
## Release $LATEST_TAG

### 📋 Summary
[Add release summary here]

### ✨ Additions
- [List new features]

### 🚀 Improvements
- [List improvements]

### 🐛 Bug Fixes
- [List bug fixes]

### 🛠 Internal
- [List internal changes]

---
For full details, see [CHANGELOG.md](https://github.com/${GITHUB_USER}/${PROGRAMNAME}/blob/main/CHANGELOG.md)
EOF
fi

print_success "Release notes prepared in $RELEASE_NOTES_FILE"

# 5.2: Let user edit release notes
echo ""
print_warning "Please review and edit the release notes"
print_info "Opening editor... (save and close when done, or delete all content to abort)"
echo ""
echo "Press Enter to open editor..."
read -r

# Determine editor
EDITOR=${EDITOR:-${VISUAL:-nano}}

if [[ "$DRY_RUN" == "true" ]]; then
    print_warning "[DRY-RUN] Would open $EDITOR to edit $RELEASE_NOTES_FILE"
else
    "$EDITOR" "$RELEASE_NOTES_FILE"
fi

# 5.3: Check if user aborted
if [[ ! -s "$RELEASE_NOTES_FILE" ]]; then
    print_error "Release notes file is empty - aborting release creation"
    rm -f "$RELEASE_NOTES_FILE"
    exit 1
fi

print_success "Release notes ready"

# =====================================
# PHASE 6: CREATE GITHUB RELEASE
# =====================================

echo ""
print_step_colored ""
print_step_colored "🚀 PHASE 6: Creating GitHub Release"
print_step_colored ""

# 6.1: Construct gh release create command
GH_RELEASE_CMD="gh release create \"$LATEST_TAG\" \
    --title \"${PROGRAMNAME_PRETTY} $LATEST_TAG\" \
    --notes-file \"$RELEASE_NOTES_FILE\" \
    \"${ARTIFACT_NAME}\""

if [[ "$IS_PRE_RELEASE" == "true" ]]; then
    GH_RELEASE_CMD="$GH_RELEASE_CMD --prerelease"
fi

# 6.2: Create the release
print_sub_step "Creating GitHub release $LATEST_TAG..."
if [[ "$DRY_RUN" == "true" ]]; then
    print_warning "[DRY-RUN] Would execute:"
    echo "$GH_RELEASE_CMD"
    echo ""
    print_warning "[DRY-RUN] Release notes content:"
    cat "$RELEASE_NOTES_FILE"
else
    if eval "$GH_RELEASE_CMD"; then
        print_success "GitHub release created successfully!"
    else
        print_error "Failed to create GitHub release"
        print_warning "Release notes file preserved at: $RELEASE_NOTES_FILE"
        exit 1
    fi
fi

# =====================================
# PHASE 7: CLEANUP
# =====================================

echo ""
print_step_colored ""
print_step_colored "🧹 PHASE 7: Cleanup"
print_step_colored ""


if [[ "$DRY_RUN" == "false" ]]; then
    print_step "Removing temporary release notes file..."
    rm -f "$RELEASE_NOTES_FILE"
    print_success "Cleanup complete"
else
    print_warning "[DRY-RUN] Would remove: $RELEASE_NOTES_FILE"
fi

# =====================================
# RELEASE COMPLETE
# =====================================

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
    echo "=========================================="
    echo "  DRY-RUN COMPLETE"
    echo "=========================================="
    echo ""
    echo "No changes were made. Review the output above."
    echo "Run without --dry-run to create the actual release."
else
    echo "=========================================="
    echo "  ✅ GITHUB RELEASE COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Release: $LATEST_TAG ($RELEASE_TYPE)"
    echo "View:    gh release view $LATEST_TAG"
    echo "URL:     https://github.com/${GITHUB_USER}/${PROGRAMNAME}/releases/tag/$LATEST_TAG"
    echo ""
    echo "Artifacts uploaded:"
    echo "  - $(basename "$WHEEL_FILE")"
    echo "  - $(basename "$SDIST_FILE")"
    echo ""
    echo "Next steps:"
    echo "  1. Verify release on GitHub:"
    echo "     https://github.com/${GITHUB_USER}/${PROGRAMNAME}/releases"
    echo "  2. Verify that PyPI upload has been done or is in progress (via GitHub Actions):"
    echo "     https://github.com/${GITHUB_USER}/${PROGRAMNAME}/actions"
    echo "  3. Announce release to users"
    echo ""
fi

# End of script