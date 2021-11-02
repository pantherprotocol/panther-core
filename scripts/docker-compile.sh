#!/usr/bin/env bash

set -o errexit

target=$1
[ -z "$1" ] && echo "[!] ERROR: Path to the target file missing"
shift;
params="${@:- --r1cs --wasm --sym --c --output /data/compiled/}"

path_this=$( cd $(dirname "$0"); pwd -L )
if [ -L "$0" ]; then
  path_this=$(dirname $(readlink ${path_this}/$(basename "$0"))) # path relatively to the symlink file
  [[ "$path_this" != /* ]] && path_this=$(cd $(dirname "$0")/${path_this}; pwd -L)
fi

docker run \
  -it \
  --rm \
  -v "${path_this}/..":/data \
   aspiers/circom circom /data/${target} ${params}
