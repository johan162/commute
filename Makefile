# Makefile for Commute Tracker PWA
# Manages build, test, and development tasks with proper dependency tracking

.PHONY: help all build test test-watch test-coverage typecheck dev preview clean install lint format deploy

# Default target
.DEFAULT_GOAL := help

# =====================================
# Configuration
# =====================================

# Directories
SRC_DIR := src
DIST_DIR := dist
SCRIPTS_DIR := scripts

# Source files
SRC_FILES := $(shell find $(SRC_DIR) -name '*.ts' -o -name '*.tsx' -o -name '*.css')
TEST_FILES := $(shell find $(SRC_DIR) -name '*.test.ts' -o -name '*.test.tsx')
CONFIG_FILES := package.json tsconfig.json vite.config.ts vitest.config.ts tailwind.config.js postcss.config.js

# Timestamps for tracking builds
BUILD_STAMP := .build-stamp
TEST_STAMP := .test-stamp
TYPECHECK_STAMP := .typecheck-stamp
INSTALL_STAMP := node_modules/.install-stamp

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# =====================================
# Help Target
# =====================================

help: ## Show this help message
	@echo "$(BLUE)Commute Tracker - Makefile targets$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make release VERSION=1.0.0 TYPE=minor    # Example release command"
	@echo "  make release VERSION=2.0.0 TYPE=major    # Example release command"
	@echo "  make release VERSION=1.0.1 TYPE=patch    # Example release command"
	@echo "  make install        	                   # Install dependencies"
	@echo "  make dev            	                   # Start development server"
	@echo "  make test           	                   # Run tests once"
	@echo "  make build          	                   # Build for production"
	@echo ""

# =====================================
# Installation & Dependencies
# =====================================

$(INSTALL_STAMP): package.json package-lock.json
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	@touch $(INSTALL_STAMP)

install: $(INSTALL_STAMP) ## Install npm dependencies

# =====================================
# Type Checking
# =====================================

$(TYPECHECK_STAMP): $(SRC_FILES) $(CONFIG_FILES) $(INSTALL_STAMP)
	@echo "$(BLUE)Running TypeScript type check...$(NC)"
	npx tsc --noEmit --strict
	@touch $(TYPECHECK_STAMP)

typecheck: $(TYPECHECK_STAMP) ## Run TypeScript type checking

# =====================================
# Testing
# =====================================

$(TEST_STAMP): $(SRC_FILES) $(TEST_FILES) $(CONFIG_FILES) $(INSTALL_STAMP)
	@echo "$(BLUE)Running tests...$(NC)"
	npm run test
	@touch $(TEST_STAMP)

test: $(TEST_STAMP) ## Run tests once and exit

test-watch: $(INSTALL_STAMP) ## Run tests in watch mode
	npm run test:watch

test-coverage: $(INSTALL_STAMP) ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage

test-ui: $(INSTALL_STAMP) ## Run tests with UI
	npm run test:ui

# =====================================
# Building
# =====================================

$(BUILD_STAMP): $(SRC_FILES) $(CONFIG_FILES) $(TYPECHECK_STAMP) $(TEST_STAMP) $(INSTALL_STAMP)
	@echo "$(BLUE)Building project with mkbld.sh...$(NC)"
	@bash $(SCRIPTS_DIR)/mkbld.sh
	@touch $(BUILD_STAMP)

build: $(BUILD_STAMP) ## Build project (runs tests, typecheck, and build)

build-only: $(INSTALL_STAMP) ## Build without running tests or typecheck
	@echo "$(BLUE)Building project...$(NC)"
	npm run build

# =====================================
# Development
# =====================================

dev: $(INSTALL_STAMP) ## Start development server
	npm run dev

preview: $(BUILD_STAMP) ## Preview production build locally
	npm run preview

# =====================================
# Deployment
# =====================================

deploy: $(BUILD_STAMP) ## Build and deploy to gh-pages branch
	@echo "$(BLUE)Deploying to gh-pages...$(NC)"
	bash $(SCRIPTS_DIR)/mkbld.sh --deploy

deploy-push: $(BUILD_STAMP) ## Build, deploy, and push to gh-pages branch
	@echo "$(BLUE)Deploying and pushing to gh-pages...$(NC)"
	bash $(SCRIPTS_DIR)/mkbld.sh --deploy --push

# =====================================
# Release Management
# =====================================

release: ## Create a release (usage: make release VERSION=1.0.0 TYPE=minor)
	@if [ -z "$(VERSION)" ]; then \
		echo "$(YELLOW)Error: VERSION is required$(NC)"; \
		echo "Usage: make release VERSION=1.0.0 TYPE=minor"; \
		echo ""; \
		echo "Examples:"; \
		echo "  make release VERSION=1.0.0 TYPE=minor"; \
		echo "  make release VERSION=2.0.0 TYPE=major"; \
		echo "  make release VERSION=1.0.1 TYPE=patch"; \
		exit 1; \
	fi
	@TYPE=$${TYPE:-minor}; \
	echo "$(BLUE)Creating release $(VERSION) ($$TYPE)...$(NC)"; \
	bash $(SCRIPTS_DIR)/mkrelease.sh $(VERSION) $$TYPE

# =====================================
# Code Quality
# =====================================

lint: $(INSTALL_STAMP) ## Run linter (if configured)
	@if grep -q '"lint"' package.json; then \
		npm run lint; \
	else \
		echo "$(YELLOW)No lint script configured in package.json$(NC)"; \
	fi

format: $(INSTALL_STAMP) ## Format code (if configured)
	@if grep -q '"format"' package.json; then \
		npm run format; \
	else \
		echo "$(YELLOW)No format script configured in package.json$(NC)"; \
	fi

# =====================================
# Cleaning
# =====================================

clean: ## Remove build artifacts and timestamps
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf $(DIST_DIR)
	rm -f $(BUILD_STAMP) $(TEST_STAMP) $(TYPECHECK_STAMP)
	@echo "$(GREEN)Clean complete!$(NC)"

clean-all: clean ## Remove all generated files including node_modules
	@echo "$(BLUE)Removing node_modules...$(NC)"
	rm -rf node_modules
	rm -f $(INSTALL_STAMP)
	@echo "$(GREEN)Deep clean complete!$(NC)"

# =====================================
# Utility Targets
# =====================================

all: install typecheck test build ## Install, typecheck, test, and build

status: ## Show status of build artifacts
	@echo "$(BLUE)Build Status:$(NC)"
	@echo "  Dependencies:  $(shell [ -f $(INSTALL_STAMP) ] && echo '$(GREEN)✓$(NC)' || echo '$(YELLOW)✗$(NC)')"
	@echo "  Type check:    $(shell [ -f $(TYPECHECK_STAMP) ] && echo '$(GREEN)✓$(NC)' || echo '$(YELLOW)✗$(NC)')"
	@echo "  Tests:         $(shell [ -f $(TEST_STAMP) ] && echo '$(GREEN)✓$(NC)' || echo '$(YELLOW)✗$(NC)')"
	@echo "  Build:         $(shell [ -f $(BUILD_STAMP) ] && echo '$(GREEN)✓$(NC)' || echo '$(YELLOW)✗$(NC)')"
	@echo ""

rebuild: clean all ## Clean and rebuild everything

watch: ## Watch for changes and run tests + typecheck
	@echo "$(BLUE)Starting file watcher...$(NC)"
	@while true; do \
		$(MAKE) --no-print-directory typecheck test; \
		sleep 2; \
	done
