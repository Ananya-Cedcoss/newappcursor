# CI/CD Quick Reference

## 🚀 Quick Commands

### Local Testing with act

```bash
# Install act (macOS)
brew install act

# Install act (Linux)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run test workflow locally
act push

# Run PR workflow locally
act pull_request

# Run specific job
act -j test

# Run with secrets
act -s CODECOV_TOKEN=your_token

# List available workflows
act -l
```

---

## 📊 Workflows Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Test Suite** | `test.yml` | Push, PR | Run all tests + coverage |
| **Build Validation** | `build.yml` | Push, PR | Validate all builds |
| **PR Checks** | `pr-check.yml` | PR only | Comprehensive PR analysis |
| **Database Migrations** | `database.yml` | Schema changes | Validate migrations |

---

## ✅ What Gets Tested

### On Every Push
✅ API Integration Tests (41 tests)
✅ UI Component Tests (83+ tests)
✅ Theme Extension Tests (97 tests)
✅ Shopify Function Tests (36 tests)
✅ Code coverage report

### On Every Pull Request
✅ All tests
✅ Build validation (Remix, Extension, Function)
✅ Code linting
✅ TypeScript type checking
✅ Bundle size check
✅ Security audit
✅ Migration validation (if schema changed)

---

## 🔧 Setup Checklist

### Repository Configuration

- [ ] Add `CODECOV_TOKEN` secret
  - Go to Settings → Secrets → New repository secret
  - Get token from [codecov.io](https://codecov.io)

- [ ] Enable branch protection for `main`
  - Settings → Branches → Add rule
  - Require status checks to pass
  - Require pull request reviews

- [ ] Add status badges to README.md
  ```markdown
  ![Tests](https://github.com/USER/REPO/workflows/Test%20Suite/badge.svg)
  ![Build](https://github.com/USER/REPO/workflows/Build%20Validation/badge.svg)
  ```

### Local Testing Setup

- [ ] Install act: `brew install act` (macOS)
- [ ] Copy secrets: `cp .secrets.example .secrets`
- [ ] Fill in tokens in `.secrets`
- [ ] Test: `act push`

---

## 📋 Workflow Details

### Test Suite (test.yml)

**Matrix:** Node.js 18.x, 20.x
**Database:** PostgreSQL 15

**Steps:**
1. Setup Node.js
2. Install dependencies
3. Generate Prisma Client
4. Run migrations
5. Run test suites
6. Generate coverage
7. Upload to Codecov
8. Comment on PR

**Environment:**
```yaml
DATABASE_URL: postgresql://test:test@localhost:5432/product_discount_test
NODE_ENV: test
```

### Build Validation (build.yml)

**Jobs:**
- Build Remix App (`npm run build`)
- Validate Theme Extension structure
- Validate Shopify Function code
- Run ESLint (`npm run lint`)
- Run TypeScript check (`npx tsc --noEmit`)

### PR Checks (pr-check.yml)

**Smart Features:**
- Detects changed files
- Runs only affected tests
- Reports bundle size
- Performs security audit
- Posts summary comment

**Example Output:**
```markdown
### 🔍 Pull Request Analysis

**Changed Areas:**
- Remix App: ✅ Modified
- Theme Extension: ⬜ No changes

**CI Status:** ✅ All checks passed
```

### Database Migrations (database.yml)

**Validates:**
- Prisma schema syntax
- Migration deployment
- Schema drift
- Backward compatibility

**Posts Report:**
```markdown
### 🗄️ Database Migration Changes

✅ Schema validation: Passed
✅ Migration deployment: Success
✅ Schema drift check: No drift
```

---

## 🐛 Troubleshooting

### Issue: Tests pass locally but fail in CI

**Solution:**
```bash
# Match CI environment
NODE_ENV=test npm test

# Check Node version
node -v  # Should be 18.x or 20.x

# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

### Issue: Database connection errors

**Check:**
- PostgreSQL service health checks
- DATABASE_URL format
- Migration status

**Debug:**
```bash
# Test database locally
npx prisma migrate dev
npx prisma db pull
```

### Issue: Coverage upload fails

**Solutions:**
- Verify `CODECOV_TOKEN` in secrets
- Check Codecov repository is connected
- Review Codecov logs in workflow

### Issue: Workflow not triggering

**Check:**
- Branch names match (`main`, `develop`)
- File paths match (for path filters)
- Workflow file syntax (YAML)

**Validate workflow:**
```bash
# Locally with act
act -n  # Dry run

# Check YAML syntax
yamllint .github/workflows/*.yml
```

---

## 📊 Viewing Results

### GitHub Actions UI
1. Go to **Actions** tab
2. Select workflow
3. Click on run
4. View job details and logs

### Pull Request Comments
Workflows automatically comment with:
- Coverage changes
- Build size
- Migration summaries
- Overall status

### Codecov Dashboard
View at: `https://codecov.io/gh/USERNAME/REPO`

### Artifacts
Download from workflow run:
- Coverage reports (30 days)
- Build artifacts (7 days)
- Test screenshots (if E2E runs)

---

## 🔒 Security

### Secrets Management
```bash
# Never commit secrets
.secrets        # Git ignored
.env*           # Git ignored

# Use GitHub Secrets
Settings → Secrets → Actions
```

### Security Audits
```bash
# Run locally
npm audit
npm audit fix

# Check for exposed secrets
git secrets --scan
```

---

## 📈 Best Practices

### For Developers

✅ **Run tests before pushing**
```bash
npm test
npm run lint
npm run build
```

✅ **Keep PRs focused**
- Small, targeted changes
- Clear description
- Link to issue

✅ **Review CI feedback**
- Check all status checks
- Review coverage changes
- Address failing tests

### For Maintainers

✅ **Require status checks**
- Enable branch protection
- Require passing tests
- Require reviews

✅ **Monitor CI health**
- Track failure rates
- Optimize slow tests
- Update dependencies

✅ **Review security alerts**
- npm audit findings
- Dependabot alerts
- TruffleHog warnings

---

## 🎯 Common Workflows

### Making a Pull Request

1. Create feature branch
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes and test locally
   ```bash
   npm test
   npm run lint
   ```

3. Commit and push
   ```bash
   git add .
   git commit -m "Add my feature"
   git push origin feature/my-feature
   ```

4. Create PR on GitHub

5. Wait for CI checks

6. Review PR comments and feedback

7. Merge when approved and checks pass

### Fixing Failing CI

1. Check workflow logs

2. Reproduce locally
   ```bash
   NODE_ENV=test npm test
   ```

3. Fix the issue

4. Push the fix
   ```bash
   git add .
   git commit -m "Fix CI issue"
   git push
   ```

5. Verify checks pass

### Updating Dependencies

1. Update package.json
   ```bash
   npm update
   ```

2. Test locally
   ```bash
   npm test
   ```

3. Create PR

4. Verify CI passes with new versions

5. Merge when safe

---

## 📚 Additional Resources

- [CI/CD Full Documentation](./CI_CD_DOCUMENTATION.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [act Documentation](https://github.com/nektos/act)
- [Codecov Docs](https://docs.codecov.com/)

---

## 🆘 Getting Help

1. Check workflow logs in Actions tab
2. Review [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)
3. Test locally with `act`
4. Open issue with workflow logs

---

**Quick tip:** Save this file for easy reference! 📌
