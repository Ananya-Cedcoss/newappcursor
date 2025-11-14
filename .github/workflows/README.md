# GitHub Actions Workflows

This directory contains CI/CD workflows for the Shopify Product Discount App.

## Workflows

### 🧪 test.yml
**Test Suite** - Runs all tests with coverage reporting

**Triggers:** Push to main/develop, Pull Requests
**Duration:** ~5-8 minutes
**What it does:**
- Sets up PostgreSQL
- Runs database migrations
- Runs all test suites (API, UI, Extensions, Functions)
- Generates coverage report
- Uploads to Codecov
- Comments coverage on PRs

### 🏗️ build.yml
**Build Validation** - Validates all builds

**Triggers:** Push to main/develop, Pull Requests
**Duration:** ~3-5 minutes
**What it does:**
- Builds Remix app
- Validates Theme Extension structure
- Validates Shopify Function code
- Runs linting and type checking

### 📋 pr-check.yml
**Pull Request Checks** - Comprehensive PR analysis

**Triggers:** Pull Requests only
**Duration:** ~5-10 minutes
**What it does:**
- Analyzes changed files
- Runs targeted tests
- Checks bundle size
- Performs security audit
- Posts summary comment

### 🗄️ database.yml
**Database Migrations** - Validates schema changes

**Triggers:** Changes to prisma/ directory
**Duration:** ~2-3 minutes
**What it does:**
- Validates Prisma schema
- Runs migrations in test mode
- Checks for schema drift
- Generates migration report

## Quick Reference

```bash
# Run all workflows
git push origin main

# Trigger PR checks
git push origin feature-branch
# Then create PR

# Test workflows locally
act push
act pull_request
```

## Status Badges

Add to your README.md:

```markdown
![Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Test%20Suite/badge.svg)
![Build](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20Validation/badge.svg)
```

## Configuration

Required secrets:
- `CODECOV_TOKEN` - For coverage upload (optional)

See [CI_CD_DOCUMENTATION.md](../../CI_CD_DOCUMENTATION.md) for complete setup guide.

## Testing Locally

Install [act](https://github.com/nektos/act):

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act push
act pull_request
```

## Workflow Status

View workflow runs: [Actions Tab](../../actions)

## Troubleshooting

Common issues:

**Tests failing in CI but passing locally:**
- Check Node.js version matches (18.x or 20.x)
- Verify environment variables
- Run with `NODE_ENV=test npm test`

**Database connection errors:**
- PostgreSQL service includes health checks
- Retry logic built-in

**Coverage upload failures:**
- Verify `CODECOV_TOKEN` secret
- Check Codecov configuration

See full troubleshooting guide in [CI_CD_DOCUMENTATION.md](../../CI_CD_DOCUMENTATION.md).
