#!/usr/bin/env bash

rm .gitignore

git config user.name "Entry Dev"
git config user.email "entrydev@nts-corp.com"

targetBranchName="deploy/${GITHUB_REF##*/}"

git checkout -b "$targetBranchName"
git push --delete "https://github.com/${GITHUB_REPO}" "$targetBranchName"
git add . --all
git commit -m "Entry-HW for electron embed into $targetBranchName"
git push --force --quiet "https://github.com/${GITHUB_REPO}" "$targetBranchName"
