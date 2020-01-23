#!/usr/bin/env bash

rm .gitignore

git config --local user.email "entrydev@nts-corp.com"
git config --local user.name "Entry Dev"

targetBranchName="dist/${GITHUB_REF##*/}"

echo "into build-base directory"
cd build-base

echo "checkout $targetBranchName and delete remote repository"
git checkout -b "$targetBranchName"

echo "forceful add files to git"
git add -f .

git commit -m "Entry-HW for electron embed into $targetBranchName"
