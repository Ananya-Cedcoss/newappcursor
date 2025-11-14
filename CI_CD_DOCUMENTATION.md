# CI/CD Documentation

## Overview

Comprehensive CI/CD pipeline for Shopify Product Discount App using **GitHub Actions**. Automated testing, building, and validation for every pull request and push.

---

## 📊 Workflow Summary

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **Test Suite** | Push, PR | Run all tests with coverage | ~5-8 min |
| **Build Validation** | Push, PR | Validate all builds | ~3-5 min |
| **PR Checks** | PR only | Comprehensive PR analysis | ~5-10 min |
| **Database Migrations** | Schema changes | Validate migrations | ~2-3 min |

---

## 🚀 Workflows

### 1. Test Suite (`test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**
- ✅ Sets up PostgreSQL database
- ✅ Runs database migrations
- ✅ Runs API Integration tests (41 tests)
- ✅ Runs UI Component tests (83+ tests)
- ✅ Runs Theme Extension tests (97 tests)
- ✅ Runs Shopify Function tests (36 tests)
- ✅ Generates coverage report
- ✅ Uploads coverage to Codecov
- ✅ Comments coverage on PR

**Matrix Strategy:**
- Tests on Node.js 18.x and 20.x
- Ensures compatibility across versions

**Environment:**
```yaml
DATABASE_URL: postgresql://test:test@localhost:5432/product_discount_test
NODE_ENV: test
```

**Steps:**
1. Checkout code
2. Setup Node.js with cache
3. Install dependencies (`npm ci`)
4. Generate Prisma Client
5. Run database migrations
6. Run test suites
7. Generate and upload coverage

**Coverage Reporting:**
- Uploads to Codecov (requires `CODECOV_TOKEN`)
- Stores as GitHub artifact (30 days retention)
- Comments on PR with coverage changes

---

### 2. Build Validation (`build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**
- ✅ Builds Remix app
- ✅ Validates Theme Extension structure
- ✅ Validates Shopify Function code
- ✅ Runs ESLint
- ✅ Runs TypeScript type checking

**Jobs:**

#### Build Remix App
```bash
npm run build
```
- Validates Remix build succeeds
- Checks build output directory
- Uploads build artifact (7 days retention)

#### Build Theme Extension
- Validates directory structure
- Checks for required files (`shopify.extension.toml`)
- Validates Liquid template syntax
- Validates JSON schema in templates
- Checks for common Liquid errors

**Key Validations:**
```bash
# Structure check
extensions/product-discount-display/
├── shopify.extension.toml  ✓
├── blocks/                  ✓
├── snippets/                ✓
└── assets/                  ✓

# Syntax validation
- Liquid tag closing
- JSON schema validity
- Required settings
```

#### Build Shopify Function
- Validates directory structure
- Checks `run.js` exports `run` function
- Validates function return structure
- Runs function tests
- Validates TOML configuration

**Key Validations:**
```javascript
// Function must export run
export function run(input) { ... }

// Must return expected structure
return { discounts: [...] }
```

#### Lint & Type Check
- Runs ESLint on codebase
- Runs TypeScript type checking
- Continues on error (non-blocking)

---

### 3. Pull Request Checks (`pr-check.yml`)

**Triggers:**
- PR opened, synchronized, or reopened

**What it does:**
- ✅ Analyzes changed files
- ✅ Identifies affected areas
- ✅ Runs targeted tests
- ✅ Checks bundle size
- ✅ Performs security audit
- ✅ Posts summary comment

**Jobs:**

#### PR Information
- Extracts PR metadata
- Detects changed files
- Identifies affected areas:
  - Remix App
  - Theme Extension
  - Shopify Function
  - Tests
- Comments on PR with analysis

**Example Comment:**
```markdown
### 🔍 Pull Request Analysis

**Changed Areas:**
- Remix App: ✅ Modified
- Theme Extension: ⬜ No changes
- Shopify Function: ✅ Modified
- Tests: ✅ Modified

**CI Status:** Running checks... ⏳
```

#### Test Affected Areas
- Intelligently runs only affected tests
- Falls back to all tests if unsure
- Reduces CI time for targeted changes

**Smart Test Selection:**
```yaml
# If app/routes changed → API + UI tests
# If extensions/product-discount-display changed → Extension tests
# If extensions/product-discount-function changed → Function tests
# If tests/ changed → All tests
```

#### Bundle Size Check
- Builds for production
- Reports build sizes
- Adds to PR summary

**Example Report:**
```markdown
### 📦 Build Size Report

- Remix Build: 2.4 MB
- Extensions: 156 KB
```

#### Security Audit
- Runs `npm audit`
- Checks for secrets with TruffleHog
- Continues on error (non-blocking)

#### PR Summary
- Aggregates all check results
- Posts comprehensive summary
- Shows pass/fail status for each check

**Example Summary:**
```markdown
### 📋 Pull Request Check Summary

| Check | Status |
|-------|--------|
| Tests | ✅ success |
| Bundle Size | ✅ success |
| Security | ✅ success |

✅ All checks passed! PR is ready for review.
```

---

### 4. Database Migrations (`database.yml`)

**Triggers:**
- Changes to `prisma/` directory
- Push or PR

**What it does:**
- ✅ Validates Prisma schema
- ✅ Runs migrations in test mode
- ✅ Checks for schema drift
- ✅ Generates migration report
- ✅ Comments on PR

**Jobs:**

#### Validate Migrations
1. **Schema Validation**
   ```bash
   npx prisma validate
   ```

2. **Migration Deployment**
   ```bash
   npx prisma migrate deploy
   ```

3. **Schema Drift Check**
   ```bash
   npx prisma db pull
   # Compare with committed schema
   ```

4. **Rollback Test Reminder**
   - Reminds to test rollback manually
   - Prisma doesn't support automated rollback

#### Migration Report
- Lists migration files
- Shows schema changes
- Comments on PR with summary

**Example Comment:**
```markdown
### 🗄️ Database Migration Changes

The Prisma schema has been modified. Please review the migration carefully.

**✅ Migration validation passed**

- Schema validation: ✅ Passed
- Migration deployment: ✅ Success
- Schema drift check: ✅ No drift detected

**Important:**
- Ensure migrations are tested locally
- Verify no breaking changes for existing data
- Consider backward compatibility
```

---

## 🔧 Setup Instructions

### 1. GitHub Repository Setup

#### Required Secrets

Add these to your GitHub repository secrets:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Required:**
- `CODECOV_TOKEN` - Codecov upload token (optional but recommended)

**Optional:**
- `SHOPIFY_API_KEY` - For deployment workflows (future)
- `SHOPIFY_API_SECRET` - For deployment workflows (future)

### 2. Codecov Setup

1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Copy the upload token
4. Add as `CODECOV_TOKEN` secret

### 3. Database Configuration

The workflows use PostgreSQL 15 in a service container. No external database needed for CI.

**Default configuration:**
```yaml
POSTGRES_USER: test
POSTGRES_PASSWORD: test
POSTGRES_DB: product_discount_test
```

### 4. Branch Protection Rules

Recommended branch protection for `main`:

```
Settings → Branches → Add rule
```

**Protections:**
- ✅ Require pull request before merging
- ✅ Require status checks to pass:
  - Test Suite
  - Build Remix App
  - Build Theme Extension
  - Build Shopify Function
  - Lint
  - Type Check
- ✅ Require branches to be up to date
- ✅ Dismiss stale reviews

---

## 📊 Viewing Results

### GitHub Actions UI

1. Navigate to **Actions** tab in repository
2. Select workflow from left sidebar
3. Click on workflow run to see details

### PR Comments

Workflows automatically comment on PRs with:
- Test coverage changes
- Build size reports
- Migration summaries
- Overall status

### Status Badges

Add to `README.md`:

```markdown
![Test Suite](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Test%20Suite/badge.svg)
![Build Validation](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20Validation/badge.svg)
```

### Coverage Reports

View at: `https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO`

---

## 🐛 Troubleshooting

### Tests Failing in CI but Passing Locally

**Cause:** Environment differences

**Solution:**
1. Check Node.js version matches (`18.x` or `20.x`)
2. Verify database connection
3. Check environment variables
4. Run with CI environment:
   ```bash
   NODE_ENV=test npm test
   ```

### Database Connection Errors

**Cause:** PostgreSQL service not ready

**Solution:** Workflows include health checks:
```yaml
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

### Coverage Upload Failures

**Cause:** Missing or invalid `CODECOV_TOKEN`

**Solution:**
1. Verify token in repository secrets
2. Check Codecov repository setup
3. Workflow continues even if upload fails (`fail_ci_if_error: false`)

### Build Timeouts

**Cause:** Long-running builds or tests

**Solution:**
1. Optimize test suite
2. Use test sharding (future enhancement)
3. Increase timeout in workflow:
   ```yaml
   timeout-minutes: 15
   ```

### Workflow Not Triggering

**Cause:** Incorrect branch or path filters

**Solution:** Check workflow triggers:
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

---

## 🚀 Advanced Configuration

### Matrix Testing

Current setup tests on Node 18.x and 20.x:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

**Add more versions:**
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 21.x]
```

### Parallel Test Execution

**Future enhancement:** Shard tests for faster execution

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npm test -- --shard=${{ matrix.shard }}/4
```

### Conditional Workflows

Run expensive checks only on main:

```yaml
if: github.ref == 'refs/heads/main'
```

### Caching

Workflows use npm cache for faster installs:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Additional caching:**
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

---

## 📈 Metrics and Monitoring

### Workflow Metrics

View in **Actions** → **Workflow** → **Insights**:
- Success rate
- Duration trends
- Failure patterns

### Coverage Trends

View on Codecov:
- Coverage over time
- File-level coverage
- Uncovered lines

### Build Size Trends

Track in PR comments:
- Build size changes
- Asset size breakdown
- Performance impact

---

## 🔄 Workflow Updates

### Modifying Workflows

1. Edit workflow file in `.github/workflows/`
2. Commit and push
3. Workflow automatically updates

### Testing Workflows Locally

Use **act** to run workflows locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act push

# Run specific job
act -j test

# Run with secrets
act -s CODECOV_TOKEN=your_token
```

### Workflow Debugging

Enable debug logging:

```bash
# In repository secrets, add:
ACTIONS_RUNNER_DEBUG = true
ACTIONS_STEP_DEBUG = true
```

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest CI Guide](https://vitest.dev/guide/ci.html)
- [Codecov Documentation](https://docs.codecov.com/)
- [Prisma CI Documentation](https://www.prisma.io/docs/guides/testing/ci-cd)
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)

---

## ✅ Checklist

Before pushing to production:

- [ ] All workflows configured
- [ ] Secrets added to repository
- [ ] Branch protection rules enabled
- [ ] Codecov connected
- [ ] Status badges added to README
- [ ] Team has CI access and permissions
- [ ] Notification settings configured
- [ ] Rollback procedures documented

---

## 🎯 Best Practices

### 1. Keep Workflows Fast
- Use caching
- Run targeted tests
- Parallelize when possible
- Optimize test suite

### 2. Make Workflows Reliable
- Handle flaky tests
- Add retries for network calls
- Use health checks for services
- Set appropriate timeouts

### 3. Provide Clear Feedback
- Descriptive job names
- Helpful error messages
- PR comments with results
- Summary for quick review

### 4. Secure Your Pipeline
- Use secrets for sensitive data
- Limit workflow permissions
- Audit third-party actions
- Review security findings

### 5. Monitor and Improve
- Track workflow duration
- Monitor failure rates
- Optimize slow steps
- Update dependencies regularly

---

## 🔮 Future Enhancements

### Planned Features
1. **E2E Testing in CI**
   - Headless browser tests
   - Shopify test store integration
   - Screenshot capture on failure

2. **Deployment Workflows**
   - Automated deployment to staging
   - Production deployment approval
   - Rollback automation

3. **Performance Testing**
   - Lighthouse CI integration
   - Bundle size limits
   - Load testing

4. **Dependency Management**
   - Automated dependency updates (Dependabot)
   - Security vulnerability scanning
   - License compliance checks

5. **Advanced Reporting**
   - Test trend analysis
   - Flaky test detection
   - Performance regression detection

---

## 📞 Support

For CI/CD issues:
1. Check workflow logs in Actions tab
2. Review this documentation
3. Check GitHub Actions status page
4. Open issue in repository

---

**CI/CD ensures code quality and reliability with every change! 🚀**
