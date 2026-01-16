#!/bin/bash

set -e

mkdir -p ai-context
OUTPUT="ai-context/context.txt"

echo "=== AI GIT CONTEXT (Human Readable) ===" > "$OUTPUT"
echo "" >> "$OUTPUT"

echo "Latest Commit:" >> "$OUTPUT"
git log -1 --oneline >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "Summary of Changes:" >> "$OUTPUT"
echo "" >> "$OUTPUT"

FILES=$(git show --name-only --pretty="" HEAD)

INDEX=1
SCHEMA_CHANGES=false
LOGIC_CHANGES=false
UI_CHANGES=false

for FILE in $FILES; do
  DIFF=$(git show HEAD -- "$FILE")

  # ---- DATA / ORM / SCHEMA (HIGHEST PRIORITY) ----
  if echo "$DIFF" | grep -E "productAnalytics|productView|viewCount|lastViewedAt|@@map|model "; then
    SCHEMA_CHANGES=true
    echo "$INDEX) Data / ORM Changes ($FILE)" >> "$OUTPUT"
    echo "   - Data model or ORM interaction updated" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    INDEX=$((INDEX+1))
    continue
  fi

  # ---- BUSINESS LOGIC ----
  if echo "$DIFF" | grep -E "DEBOUNCE|findUnique|update\(|create\(|getTime\(|if\s*\("; then
    LOGIC_CHANGES=true
    echo "$INDEX) Business Logic Changes ($FILE)" >> "$OUTPUT"
    echo "   - API behavior or counting logic modified" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    INDEX=$((INDEX+1))
    continue
  fi

  # ---- UI / TEXT (LOWEST PRIORITY) ----
  if echo "$DIFF" | grep -E "TitleBar|title=|Text|console\.error"; then
    UI_CHANGES=true
    echo "$INDEX) UI Updates ($FILE)" >> "$OUTPUT"
    echo "   - UI text or labels updated" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    INDEX=$((INDEX+1))
    continue
  fi
done

echo "Change Categories:" >> "$OUTPUT"

if [ "$SCHEMA_CHANGES" = true ]; then
  echo "- Database / ORM changes" >> "$OUTPUT"
fi

if [ "$LOGIC_CHANGES" = true ]; then
  echo "- Business logic changes" >> "$OUTPUT"
fi

if [ "$UI_CHANGES" = true ]; then
  echo "- UI / UX changes" >> "$OUTPUT"
fi
