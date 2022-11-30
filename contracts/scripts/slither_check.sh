#!/usr/bin/env bash

PWD=$(pwd)

# [0] - put symlink to openzeppelin if missing, and remove it on exit
oz_lib=${PWD}/node_modules/@openzeppelin
if [[ ! -e ${oz_lib} ]]; then
    # set to remove symlink on exit
    trap "unlink ${oz_lib}" EXIT
    # create symlink
    ln -s ${PWD}/../node_modules/@openzeppelin ${oz_lib}
fi

# [1] - execute slither
HARDHAT_NO_MNEMONIC=yes python3 -m slither . \
    --filter-paths "openzeppelin|contracts/common/proxy|mocks|pNftToken/" \
    --compile-force-framework Hardhat \
    --exclude naming-convention \
    --triage-mode
