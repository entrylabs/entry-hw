#!/usr/bin/env bash

rm .gitignore

git config --global user.name "Entry Dev"
git config --global user.email "entrydev@nts-corp.com"

targetBranchName="dist/${GITHUB_REF##*/}"

cd build-base
git checkout -b "$targetBranchName"
git push --delete "https://github.com/entrylabs/entry-hw" "$targetBranchName"

# TODO rm all unrelated files
git add -f app/src/main/**
git add -f app/src/preload/**
git add -f app/src/renderer/**

git commit -m "Entry-HW for electron embed into $targetBranchName"
git push --force --quiet "https://github.com/entrylabs/entry-hw" "$targetBranchName"
