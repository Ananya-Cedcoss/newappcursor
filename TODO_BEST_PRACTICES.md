# Todo List Best Practices for Development Projects

## General Principles

### 1. Add Framework Verification Steps
When working with frameworks/platforms with strict rules (Shopify, React, Docker, etc.):

**Before:**
```
- Create component
- Add features
```

**Better:**
```
- Create component
- Verify structure follows framework rules ← Add this
- Add features
- Test build/compilation early ← Add this
```

### 2. Include Early Testing
Don't wait until the end to test. Add incremental tests:

**Example:**
```
- Generate Shopify extension
- Test: Run shopify app dev ← Test immediately after generation
- Add discount block
- Test: Verify block appears in theme editor ← Test after each major addition
- Add styling
- Test: Check CSS loads correctly
```

### 3. Documentation Placement
Specify WHERE documentation should go:

**Before:**
```
- Add README with examples
```

**Better:**
```
- Add README (in project root, NOT in extension folder)
- Add integration examples (in docs/ folder)
```

### 4. Framework-Specific Constraints
When dealing with constrained environments, explicitly note limitations:

**Example for Shopify Theme Extensions:**
```
- Create theme app extension
  NOTE: Only assets/, blocks/, snippets/, locales/ allowed
- Add discount block (in blocks/ folder)
- Add styles (in assets/ folder ONLY)
- Add examples (in project docs/, NOT in extension/)
```

## Specific Recommendations for This Project

### When Adding Shopify Extensions:

```markdown
1. Generate extension
   - Run: shopify app generate extension --template theme_app_extension
   - Verify only allowed directories exist

2. Understand structure constraints
   - ALLOWED: assets/, blocks/, snippets/, locales/, shopify.extension.toml
   - NOT ALLOWED: src/, lib/, examples/, README.md, etc.

3. Create components (following structure)
   - Add blocks/*.liquid files
   - Add snippets/*.liquid files
   - Add assets/*.css files
   - Add locales/*.json files

4. Test early and often
   - After generation: shopify app dev
   - After adding blocks: check theme editor
   - After CSS changes: verify loading in browser

5. Documentation goes in project root
   - Project root: README.md, GUIDE.md, etc.
   - NOT in extension folder
```

## Red Flags to Watch For

### 🚩 Warning Signs You Might Violate Structure Rules:

1. **Adding non-standard directories** to generated scaffolds
   - ❌ `extensions/my-ext/examples/`
   - ❌ `extensions/my-ext/docs/`
   - ❌ `extensions/my-ext/utils/`

2. **Adding loose files** to strict folders
   - ❌ `extensions/my-ext/README.md`
   - ❌ `extensions/my-ext/notes.txt`

3. **Not testing immediately** after generation
   - If you generate something and add files without testing, you might violate rules

### ✅ Good Practices:

1. **Generate, then test**
   ```bash
   shopify app generate extension --template theme_app_extension
   shopify app dev  # Test immediately
   ```

2. **Read the generated structure**
   ```bash
   ls -la extensions/my-extension/
   # See what was created by the CLI
   # Only add files in those directories
   ```

3. **Check documentation first**
   - Before adding files, search: "Shopify theme app extension structure"
   - Verify allowed directories

4. **Use the CLI's built-in structure**
   - If the CLI didn't create a directory, you probably shouldn't either

## Updated Todo Template for Shopify Extensions

```markdown
## Shopify Theme App Extension

### Setup & Verification
- [ ] Generate extension: `shopify app generate extension --template theme_app_extension --name <name>`
- [ ] Verify structure (should only have: assets/, blocks/, snippets/, locales/)
- [ ] Test build: `shopify app dev`
- [ ] Confirm extension loads without errors

### Development
- [ ] Create blocks/<name>.liquid
- [ ] Test: Verify block appears in theme editor
- [ ] Create snippets/<name>.liquid
- [ ] Test: Verify snippet can be rendered
- [ ] Add assets/<name>.css
- [ ] Test: Verify CSS loads on storefront

### Integration
- [ ] Add to theme editor (manual test)
- [ ] Test on product page
- [ ] Test on collection page
- [ ] Test responsive design

### Documentation (in project root)
- [ ] Create EXTENSION_README.md (in root)
- [ ] Add integration examples to main README
- [ ] Document theme editor settings
```

## Checklist Before Creating Files

Use this mental checklist:

1. **Am I in a framework-specific folder?**
   - Yes → Check framework docs for allowed structure
   - No → Proceed normally

2. **Did a CLI generate this folder?**
   - Yes → Only add files in existing subdirectories
   - No → I can structure as needed

3. **Can I test this immediately?**
   - Yes → Test now, catch errors early
   - No → Why not? Add a test step

4. **Where should documentation live?**
   - Framework folder → Probably NOT here
   - Project root → Usually safe
   - Separate docs/ folder → Usually safe

## Framework-Specific Notes

### Shopify Theme Extensions
- **Allowed:** assets/, blocks/, snippets/, locales/
- **Config:** shopify.extension.toml only
- **Test command:** `shopify app dev`

### Shopify App Extensions (other types)
- Each type has different rules
- Check with `shopify app generate extension` and see what's created

### React/Next.js
- More flexible, but follow conventions
- Test with build command early

### Docker
- Strict about Dockerfile location
- .dockerignore must be in context root

## Recovery Steps When You Violate Structure

If you get a structure error:

1. **Don't panic** - It's usually an easy fix
2. **Read the error message** - It often tells you what's wrong
3. **Check what directories exist** - `ls -la`
4. **Remove invalid files/folders** - `rm -rf invalid-dir/`
5. **Move documentation** - `mv extension/README.md ./`
6. **Test again** - `shopify app dev`

## Key Takeaway

**When in doubt, test early!**

The earlier you catch structure violations, the easier they are to fix. Don't wait until you've created 10 files in an invalid directory.

**Best practice:**
- Generate → Test → Add one file → Test → Add next file → Test

This might feel slower, but it prevents the frustration of fixing 10 files at once.
