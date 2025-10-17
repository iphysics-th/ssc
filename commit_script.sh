#!/bin/bash

# ============================================================
# Git Commit Script with Auto SSH→HTTPS Fallback
# ============================================================
# Usage:
#   ./commit_script.sh "Your commit message"
# ============================================================

REPO_SSH="git@github.com:iphysics-th/ssc.git"
REPO_HTTPS="https://github.com/iphysics-th/ssc.git"
BRANCH="main"

# --- Check for commit message ---
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a commit message."
  echo "Usage: ./commit_script.sh \"Your commit message here\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "=================================================="
echo "🚀 Starting Git Commit Workflow for branch '$BRANCH'"
echo "=================================================="

# 1️⃣ Stage changes
echo "-> Adding changes..."
git add .

if git diff --cached --quiet; then
  echo "✅ No changes to commit. Exiting."
  exit 0
fi

# 2️⃣ Commit
echo "-> Committing with message: \"$COMMIT_MESSAGE\""
if ! git commit -m "$COMMIT_MESSAGE"; then
  echo "❌ Commit failed. Check for conflicts."
  exit 1
fi

# 3️⃣ Try SSH push first
echo "-> Trying to push via SSH..."
# Set SSH as remote
git remote set-url origin "$REPO_SSH"

# Run push with 5s timeout
timeout 5 git push origin "$BRANCH"
PUSH_STATUS=$?

if [ $PUSH_STATUS -eq 0 ]; then
  echo "✅ Successfully pushed via SSH!"
else
  echo "⚠️ SSH push failed or timed out. Switching to HTTPS..."
  git remote set-url origin "$REPO_HTTPS"

  echo "-> Retrying push via HTTPS..."
  if git push origin "$BRANCH"; then
    echo "✅ Successfully pushed via HTTPS!"
  else
    echo "❌ Push failed via both SSH and HTTPS."
    exit 1
  fi
fi

echo "=================================================="
echo "🎉 Done!"
echo "=================================================="
