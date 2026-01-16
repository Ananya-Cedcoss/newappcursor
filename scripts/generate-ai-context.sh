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
UI_CHANGES=false
LOGIC_CHANGES=false

for FILE in $FILES; do
  DIFF=$(git show HEAD -- "$FILE")

  # ---- PRISMA SCHEMA DETECTION ----
  if [[ "$FILE" == *schema.prisma ]]; then
    SCHEMA_CHANGES=true
    echo "$INDEX) Database Schema Changes ($FILE)" >> "$OUTPUT"

    if echo "$DIFF" | grep -q "model ProductView"; then
      echo "   - Model renamed from ProductView to ProductAnalytics" >> "$OUTPUT"
    fi

    if echo "$DIFF" | grep -q "@@map"; then
      echo "   - Database table mapping updated" >> "$OUTPUT"
    fi

    if echo "$DIFF" | grep -q "+  lastViewedAt"; then
      echo "   - New field added: lastViewedAt (DateTime)" >> "$OUTPUT"
    fi

    echo "" >> "$OUTPUT"
    INDEX=$((INDEX+1))
    continue
  fi

  # ---- UI CHANGES ----
  if echo "$DIFF" | grep -E "TitleBar|title=|Text|console\.error"; then
    UI_CHANGES=true
    echo "$INDEX) UI Updates ($FILE)" >> "$OUTPUT"
    echo "   - UI text or labels updated" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    INDEX=$((INDEX+1))
    continue
  fi

  # ---- LOGIC CHANGES ----
  if echo "$DIFF" | grep -E "if\s*\(|async|await|db\.|SELECT|INSERT"; then
    LOGIC_CHANGES=true
    echo "$INDEX) Logic Changes ($FILE)" >> "$OUTPUT"
    echo "   - Business or API logic updated" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    INDEX=$((INDEX+1))
    continue
  fi
done

echo "Change Categories:" >> "$OUTPUT"

if [ "$SCHEMA_CHANGES" = true ]; then
  echo "- Database / schema changes" >> "$OUTPUT"
fi

if [ "$UI_CHANGES" = true ]; then
  echo "- UI / UX changes" >> "$OUTPUT"
fi

if [ "$LOGIC_CHANGES" = true ]; then
  echo "- Business logic changes" >> "$OUTPUT"
fi
