pragma circom 2.0.0;
include "../../circuits/templates/rewards.circom";

component main{public [extAmountIn, forTxReward, forUtxoReward,
 forDepositReward, forBaseReward, relayerTips, amountsIn, createTimes, spendTime, assetWeight]} = Rewards(2);