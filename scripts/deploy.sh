#!/usr/bin/env bash

rm .gitignore

git config user.name "Entry Dev"
git config user.email "entrydev@nts-corp.com"

targetBranchName="deploy/${GITHUB_REF##*/}"

git checkout -b "$targetBranchName"
git push --delete "https://github.com/${GITHUB_REPO}" "$targetBranchName"

# TODO rm all unrelated files
git add -f app/src/main/dist/**
git add -f app/src/preload/**
git add -f app/src/renderer/**

git commit -m "Entry-HW for electron embed into $targetBranchName"
git push --force --quiet "https://github.com/${GITHUB_REPO}" "$targetBranchName"
