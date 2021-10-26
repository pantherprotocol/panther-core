const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const F = require("circomlibjs").babyjub.F;

const assert = chai.assert;
let circuitRewards;
describe("Rewards circuit", async () => {
  beforeEach(async () => {
    circuitRewards = await wasm_tester(
      path.join(__dirname, "circuits", "rewards.circom")
    );
  });
  it("Should compute valid rewards", async () => {
    circuitRewards = await wasm_tester(
      path.join(__dirname, "circuits", "rewards.circom")
    );

    /*
    R := forTxReward + forBaseReward + forUtxoReward * sum[over i](UTXO_period_i * UTXO_amount_i) * asset_weight  + forDepositReward * deposit_amount * asset_weight
    `C1` - "base" reward to a user “for transaction"
    `C2` - factor to reward a user for “shielded UTXO”
    `C4` - factor to reward a user “for deposit”
    `C3` - “base” reward to a relayer “for transaction"

    Ru = R - C3 - Relayer_tips
    Rr = C3 + Relayer_tips

    R= forTxReward + forBaseReward + (forUtxoReward * sum[over i](UTXO_period_i * UTXO_amount_i) + forDepositReward * deposit_amount) * asset_weight;
    S1 = forTxReward + forBaseReward;
    S2 = forDepositReward * deposit_amount
    S3 = sum[over i](UTXO_period_i * UTXO_amount_i)
    S4 = forUtxoReward * S3
    S5 = (S4 + S2)*assetWeight
    R = S1 + S5
*/

    const input = {
      extAmountIn: F.e(10),
      forTxReward: F.e(2),
      forUtxoReward: F.e(3),
      forDepositReward: F.e(4),
      forBaseReward: F.e(2),
      relayerTips: F.e(2),
      amountsIn: [F.e(2), F.e(4)],
      createTimes: [F.e(10), F.e(15)],
      spendTime: F.e(20),
      assetWeight: F.e(2),
    };
    let S3 = 0n;
    let S1 = input.forTxReward + input.forBaseReward;
    let S2 = input.forDepositReward * input.extAmountIn;
    for (var i = 0; i < input.amountsIn.length; i++) {
      S3 += input.amountsIn[i] * (input.spendTime - input.createTimes[i]);
    }
    let S4 = S3 * input.forUtxoReward;
    let S5 = (S4 + S2) * input.assetWeight;
    let R = S1 + S5;

    const Rr = input.forBaseReward + input.relayerTips;
    const Ru = R - Rr;

    const w = await circuitRewards.calculateWitness(input, true);

    await circuitRewards.assertOut(w, { userRewards: Ru, relayerRewards: Rr })
  });
});

