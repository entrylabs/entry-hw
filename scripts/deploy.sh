#!/usr/bin/env bash

rm .gitignore

git config user.name "Entry Dev"
git config user.email "entrydev@nts-corp.com"

targetBranchName="deploy/${GITHUB_REF##*/}"

git checkout -b "$targetBranchName"
git push --delete "https://${GITHUB_TOKEN}@github.com/entrylabs/entry-hw" "$targetBranchName"
git add .
git commit -m "Entry-HW for electron embed into $targetBranchName"
git push --force --quiet "https://${GITHUB_TOKEN}@github.com/entrylabs/entry-hw" "$targetBranchName"
