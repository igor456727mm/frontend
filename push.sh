#!/bin/bash
git add .
message=""
if [[ $1 ]]
then
    message="$npm_package_version - $1"
else
    message=$npm_package_version
fi
git commit -am "$message"
git push origin master
