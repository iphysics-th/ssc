#!/bin/bash

# A simple script to automate the git add, commit, and push process.
# This script assumes you are running it inside the root directory
# of the 'ssc' repository and you have already set up SSH or HTTPS
# authentication for GitHub.

# --- Configuration ---
# The repository URL (used only for display, not necessary for git operations
# once the remote is set up)
REPO_URL="https://github.com/iphysics-th/ssc.git"

# Default branch name
DEFAULT_BRANCH="main"

# Check if a commit message was provided as an argument
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a commit message."
  echo "Usage: ./commit_script.sh \"Your commit message here\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "=================================================="
echo " Starting Git Commit Workflow for $REPO_URL"
echo "=================================================="

# 1. Add all changes to the staging area
echo "-> 1. Adding all changes (git add .)..."
git add .

# Check if there are any changes to commit
if git diff --cached --quiet; then
    echo "-> No changes detected. Exiting script."
    exit 0
fi

# 2. Commit the changes
echo "-> 2. Committing changes with message: \"$COMMIT_MESSAGE\""
# Uses the provided argument as the commit message
if ! git commit -m "$COMMIT_MESSAGE"; then
    echo "❌ Git commit failed. Please check for conflicts or errors."
    exit 1
fi

# 3. Push the changes to the default branch (main)
echo "-> 3. Pushing changes to remote branch '$DEFAULT_BRANCH'..."
if git push origin "$DEFAULT_BRANCH"; then
    echo "✅ Successfully committed and pushed to GitHub!"
else
    echo "❌ Git push failed. Please check your network connection or permissions."
    # If push fails, offer a warning but let the script exit gracefully (commit is still local)
    exit 1
fi

echo "=================================================="

exit 0
