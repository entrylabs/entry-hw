#!/usr/bin/env bash

rm .gitignore

git config --global user.name "Entry Dev"
git config --global user.email "entrydev@nts-corp.com"

targetBranchName="dist/${GITHUB_REF##*/}"

echo "into build-base directory"
cd build-base

echo "checkout $targetBranchName and delete remote repository"
git checkout -b "$targetBranchName"
git push --delete "https://${GITHUB_TOKEN}@github.com/entrylabs/entry-hw" "$targetBranchName"

echo "forceful add files to git"
git add -f .

git commit -m "Entry-HW for electron embed into $targetBranchName"
git push --force --quiet "https://${GITHUB_TOKEN}@github.com/entrylabs/entry-hw" "$targetBranchName"
