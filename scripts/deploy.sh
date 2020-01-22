#!/usr/bin/env bash

#rm .gitignore
#
#git config user.name "Entry Dev"
#git config user.email "entrydev@nts-corp.com"

targetBranchName="deploy/${GITHUB_REF##*/}"

#git checkout -b "$targetBranchName"
#git push --delete

echo ${targetBranchName}
export
