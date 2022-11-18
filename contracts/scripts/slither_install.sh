#!/usr/bin/env bash
# [0] - install specific version
pip3 install --upgrade --no-deps --force-reinstall slither-analyzer==0.9.0
# [1] - get package location
SLITHER_PKG_LOCATION=$(pip3 show slither-analyzer | grep Location | awk '{print $2}')
# [2] - file to patch
SLITHER_FILE_TO_PATCH=${SLITHER_PKG_LOCATION}/slither/visitors/expression/constants_folding.py
# [3] - MD5 actual vs expected
MD5=$(md5 -q ${SLITHER_FILE_TO_PATCH})
MD5_EXPECTED="07ed25b808f8789edad4724bb9956493"
MD5_PATCHED="b26deeeefa7424137d238328254c77a5"
# [4] - check md5 (07ed25b808f8789edad4724bb9956493 -- for v0.9.1)
if [[ "${MD5}" == "${MD5_PATCHED}" ]]; then
    echo "No need to patch - already patched version"
elif [[ "${MD5}" != "${MD5_EXPECTED}" ]]; then
    echo "MD5 sum for ${SLITHER_FILE_TO_PATCH} is ${MD5} not equal to expected ${MD5_EXPECTED}"
    exit 1
else
    # [6] - patch
    patch ${SLITHER_FILE_TO_PATCH} scripts/slither.patch
fi
