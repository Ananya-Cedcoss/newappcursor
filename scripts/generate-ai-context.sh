#!/bin/bash

mkdir -p ai-context

echo "=== AI GIT CONTEXT ===" > ai-context/context.txt
echo "" >> ai-context/context.txt

echo "Latest Commit:" >> ai-context/context.txt
git log -1 --oneline >> ai-context/context.txt
echo "" >> ai-context/context.txt

echo "Files & Line-Level Changes:" >> ai-context/context.txt
echo "" >> ai-context/context.txt

# Show unified diff for the latest commit
git show HEAD --unified=3 >> ai-context/context.txt
