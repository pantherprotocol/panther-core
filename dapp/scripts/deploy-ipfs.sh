#!/bin/bash

rm -rfd build
NODE_ENV=production yarn build:prod
ipfs add -r build --quiet | tail -n 1 > ipfs_hash.txt
ipfs pin add -r $(cat ipfs_hash.txt)
echo assets build pinned to https://ipfs.io/ipfs/$(cat ipfs_hash.txt)

function os_sed() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$1" "$2"
    else
        sed -i "$1" "$2"
    fi
}

# # replase substrings in index.html file
filename="build/index.html"

function replace_file_path_with_url() {
    # $1 -> search string
    search="$1"
    replace="https:\/\/ipfs.io\/ipfs\/$(cat ipfs_hash.txt)\/$1"
    os_sed "s/$search/$replace/" $filename
}

files_to_repalce=("main.js" "circomlib.js" "vendor-react.js" "logo.png")

for file in ${files_to_repalce[@]}; do
    replace_file_path_with_url "$file"
done

search="%PUBLIC_URL%\/"
replace=""
os_sed "s/$search/$replace/" $filename

search="\/manifest"
replace="https:\/\/ipfs.io\/ipfs\/$(cat ipfs_hash.txt)\/manifest"
os_sed "s/$search/$replace/g" $filename

ipfs add -r build --quiet | tail -n 1 > ipfs_hash.txt
ipfs pin add -r $(cat ipfs_hash.txt)
echo App deployed to https://ipfs.io/ipfs/$(cat ipfs_hash.txt)

# echo publishing to IPNS -> $(cat ipfs_hash.txt)
# ipfs name publish $(cat ipfs_hash.txt)

# cleaning
rm ipfs_hash.txt
