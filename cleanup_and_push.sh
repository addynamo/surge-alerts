#!/bin/bash

# Configure git with token-based authentication
git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

# Remove existing repository and clone fresh
rm -rf .git
git init

# Add the remote repository
git remote add origin https://github.com/addynamo/surge-alerts.git

# Create an empty commit and force push to remove history
git commit --allow-empty -m "Clean slate"
git push -f origin main

# Add all new files
git add .

# Commit new files
git commit -m "Initial commit: Social Media Surge Detection Service"

# Push to remote repository
git push -f origin main