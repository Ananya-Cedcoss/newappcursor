#!/bin/bash

mkdir -p ai-context
OUTPUT="ai-context/context.txt"

echo "=== AI GIT CONTEXT (Human Readable) ===" > $OUTPUT
echo "" >> $OUTPUT

# Latest commit
echo "Latest Commit:" >> $OUTPUT
git log -1 --oneline >> $OUTPUT
echo "" >> $OUTPUT

echo "Summary of Changes:" >> $OUTPUT
echo "" >> $OUTPUT

FILES=$(git show --name-only --pretty="" HEAD)

INDEX=1
UI_CHANGES=false
LOGIC_CHANGES=false

for FILE in $FILES; do
  echo "$INDEX) $FILE" >> $OUTPUT

  DIFF=$(git show HEAD -- "$FILE")

  # Heuristic rules
  if echo "$DIFF" | grep -E 'TitleBar|title=|Text |console.error'; then
    echo "   - Updated UI text or labels" >> $OUTPUT
    UI_CHANGES=true
  fi

  if echo "$DIFF" | grep -E 'required|validation|error'; then
    echo "   - Improved validation or error messaging" >> $OUTPUT
    UI_CHANGES=true
  fi

  if echo "$DIFF" | grep -E 'if\s*\(|return\s*\{|async|await|db\.|SELECT|INSERT'; then
    echo "   - Business or logic-level changes detected" >> $OUTPUT
    LOGIC_CHANGES=true
  fi

  echo "" >> $OUTPUT
  INDEX=$((INDEX+1))
done

echo "Change Type:" >> $OUTPUT

if [ "$UI_CHANGES" = true ]; then
  echo "- UI / UX text updates" >> $OUTPUT
fi

if [ "$LOGIC_CHANGES" = true ]; then
  echo "- Business logic changes" >> $OUTPUT
else
  echo "- No business logic changes" >> $OUTPUT
fi
