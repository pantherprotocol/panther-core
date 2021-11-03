const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const F = require("circomlibjs").babyjub.F;
const { getOptions } = require("./helpers/circomTester");

describe("Rewards circuit", async () => {
  let circuitRewards;

  before(async () => {
    const opts = getOptions();
    const input = path.join(opts.basedir, "./test/circuits/rewards.circom");
    circuitRewards = await wasm_tester(input, opts);
  });

  it("Should compute valid rewards", async () => {
    /*
    // Total reward (i.e. user reward plus relayer reward)
    R= forTxReward + (
      forUtxoReward * sum[over i](UTXO_period_i * UTXO_amount_i) +
      forDepositReward * deposit_amount
    ) * asset_weight

    S1 = forTxReward
    S2 = forDepositReward * deposit_amount
    S3 = sum[over i](UTXO_period_i * UTXO_amount_i)
    S4 = forUtxoReward * S3
    S5 = (S4 + S2)*assetWeight
    R = S1 + S5

    // User reward
    rAmount = R -  rAmountTips
    // Relayer reward
    rAmountTips
    */

    const input = {
      extAmountIn: F.e(10),
      forTxReward: F.e(2),
      forUtxoReward: F.e(3),
      forDepositReward: F.e(4),
      rAmountTips: F.e(2),
      amountsIn: [F.e(2), F.e(4)],
      createTimes: [F.e(10), F.e(15)],
      spendTime: F.e(20),
      assetWeight: F.e(2),
    };
    let S3 = 0n;
    let S1 = input.forTxReward;
    let S2 = input.forDepositReward * input.extAmountIn;
    for (var i = 0; i < input.amountsIn.length; i++) {
      S3 += input.amountsIn[i] * (input.spendTime - input.createTimes[i]);
    }
    let S4 = S3 * input.forUtxoReward;
    let S5 = (S4 + S2) * input.assetWeight;
    let R = S1 + S5;

    const rAmountTips = input.rAmountTips;
    const rAmount = R - rAmountTips;

    const w = await circuitRewards.calculateWitness(input, true);

    await circuitRewards.assertOut(w, { rAmount: rAmount })
  });
});
