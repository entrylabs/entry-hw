#!/usr/bin/env bash

rm .gitignore

targetBranchName="dist/${GITHUB_REF##*/}"

echo "into build-base directory"
cd build-base

echo "checkout $targetBranchName and delete remote repository"
git checkout -b "$targetBranchName"

echo "forceful add files to git"
git add -f .

git commit -m "Entry-HW for electron embed into $targetBranchName"
git push --force --quiet "https://github.com/entrylabs/entry-hw" "$targetBranchName"
