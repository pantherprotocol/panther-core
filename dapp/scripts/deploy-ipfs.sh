#!/bin/bash

rm -rfd build
NODE_ENV=production yarn build:prod
ipfs add -r build --quiet | tail -n 1 > ipfs_hash.txt
ipfs pin add -r $(cat ipfs_hash.txt)
echo assets build pinned to https://ipfs.io/ipfs/$(cat ipfs_hash.txt)

function replaceFileNames() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$1" "$2"
    else
        sed -i "$1" "$2"
    fi
}

# # replase substrings in index.html file
filename="build/index.html"

search="bundle.js"
replace="https:\/\/ipfs.io\/ipfs\/$(cat ipfs_hash.txt)\/bundle.js"
sed -i '' "s/$search/$replace/" $filename

search="%PUBLIC_URL%\/"
replace=""
replaceFileNames "s/$search/$replace/" $filename

search="logo.png"
replace="https:\/\/ipfs.io\/ipfs\/$(cat ipfs_hash.txt)\/logo.png"
replaceFileNames "s/$search/$replace/g" $filename

search="\/manifest"
replace="https:\/\/ipfs.io\/ipfs\/$(cat ipfs_hash.txt)\/manifest"
replaceFileNames "s/$search/$replace/g" $filename

ipfs add -r build --quiet | tail -n 1 > ipfs_hash.txt
ipfs pin add -r $(cat ipfs_hash.txt)
echo App deployed to https://ipfs.io/ipfs/$(cat ipfs_hash.txt)

# echo publishing to IPNS -> $(cat ipfs_hash.txt)
# ipfs name publish $(cat ipfs_hash.txt)

# cleaning
rm ipfs_hash.txt
