#!/bin/bash

mkdir -p ai-context

echo "=== AI GIT CONTEXT ===" > ai-context/context.txt

echo "" >> ai-context/context.txt
echo "Latest Commit:" >> ai-context/context.txt
git log -1 --oneline >> ai-context/context.txt

echo "" >> ai-context/context.txt
echo "Files Changed:" >> ai-context/context.txt
git show --name-status --oneline HEAD >> ai-context/context.txt
