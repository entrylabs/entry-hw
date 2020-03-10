#!/usr/bin/env bash
# shell cwd must be project's root

yarn install
yarn webpack:prod

export GITHUB_REF=build/dummy
./scripts/build.sh
./scripts/deploy.sh

git restore .gitignore
