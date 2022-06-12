#!/usr/bin/env bash

set -o errexit

trap on_exit EXIT

ganache_port=8545
log_file="/dev/null"
start_only=
MNEMONIC_STR="novel grunt steel pioneer erosion heavy mountain illegal knock black version monkey"

on_exit() {
  [ -n "${start_only}" ] && return
  shutdown_ganache
}

is_ganache_running() {
  ps -p "${ganache_pid}" > /dev/null;
}

shutdown_ganache() {
  PIDs=$(pgrep -f "${MNEMONIC_STR}")
  kill -9 ${PIDs}
  [ "$?" == "0" ] && echo -e "\nganache-cli killed"
}

while [[ $# -gt 0 ]]
do
case $1 in
  --eval-and-exit)
  EVAL_CMD="$2"
  shift
  shift
  ;;
  --start-and-exit)
  start_only=yes
  ;;
  --from-snapshot)
  FROM_SNAPSHOT=YES
  shift
  ;;
  --take-snapshot)
  TAKE_SNAPSHOT=YES
  shift
  ;;
  --no-deploy)
  NO_DEPLOY=YES
  shift
  ;;
  --log-file=*)
  log_file="${1#*=}"
  shift
  ;;
  --ganache-args=*)
  GANACHE_ARGS="${1#*=}"
  shift
  ;;
  *)
  echo "Unknown argument provided!"
  echo "arg: $1"
  exit 1
  ;;
esac
done

if [[ -n "$FROM_SNAPSHOT" && -n "$TAKE_SNAPSHOT" ]]; then
  echo "--from-snapshot and --take-snapshot can't be used at the same time!"
  exit 1
fi
if [[ -n "$FROM_SNAPSHOT" && -z "$NO_DEPLOY" ]]; then
  echo "--from-snapshot requires --no-deploy to be set!"
  exit 1
fi
if [[ -n "$TAKE_SNAPSHOT" && -n "$NO_DEPLOY" ]]; then
  echo "--take-snapshot and --no-deploy can't be used at the same time!"
  exit 1
fi

if [[ -n "$FROM_SNAPSHOT" ]]; then
  tar -xzf pchain/snapshot.tar.gz
fi

echo "Starting new ganache-cli instance."
npx --quiet ganache-cli \
  --port "$ganache_port" \
  --networkId "1994" \
  --gasLimit "25000000" \
  --defaultBalanceEther "1000000" \
  --deterministic \
  --mnemonic "${MNEMONIC_STR}" \
  ${GANACHE_ARGS} \
  `if [[ -n "$FROM_SNAPSHOT" || -n "$TAKE_SNAPSHOT" ]]; then echo --db "./pchain/snapshot"; fi` \
  1>"${log_file}" &

ganache_pid=$!
disown
sleep 1

if [[ -z "$NO_DEPLOY" ]]; then
  npx --quiet hardhat deploy --network pchain --tags pchain
fi

if [[ -n "$TAKE_SNAPSHOT" ]]; then
  sleep 3
  tar -zcf pchain/snapshot.tar.gz pchain/snapshot
  rm -r pchain/snapshot
  echo "✓ created snapshot"
  exit 0
fi

[ -n "${start_only}" ] && { echo "Done (Started)" ; exit; }

echo "✓ ready"

if [[ -n "$EVAL_CMD" ]]; then
  eval $EVAL_CMD
  if [[ -n "$FROM_SNAPSHOT" ]]; then
    rm -r p-chain/snapshot/
  fi
else
  while is_ganache_running; do sleep 1; done
fi

echo "Done. Terminating..."
