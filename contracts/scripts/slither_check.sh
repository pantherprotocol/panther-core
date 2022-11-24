#!/usr/bin/env bash
# [0] - put link
ln -s $(pwd)/../node_modules/@openzeppelin $(pwd)/node_modules/@openzeppelin
# [1] - execute slither
HARDHAT_NO_MNEMONIC=yes python3 -m slither . --filter-paths "openzeppelin|contracts/common/proxy|mocks/" --compile-force-framework Hardhat --exclude naming-convention
# [2] - remove link
unlink $(pwd)/node_modules/@openzeppelin
