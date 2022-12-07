function textWithLink(text: string, link: string): string {
    return `<a target="_blank" href=${link}>${text}</a>`;
}

export const prpTooltip =
    'PRPs (Panther Reward Points). This additional reward, aimed toward incentivizing Advanced Staking, will also be created in the Shielded Pool as a calculation based on the number of $zZKP for a given user. Users will be able to convert PRPs to $zZKP using the Reward Converter when the core protocol (Panther Core V1) launches. Note: there are two types of PRP - flat and accrued- with different behaviors. Please, find details on PRP in the Panther documentation.';

export const zAssetTooltip =
    '$zZKP in a MASP. This reward is calculated based on your Stake but created as a transaction in the MASP. You will be able to redeem $zZKP for $ZKP using the Withdraw option at the end of the Advanced Staking period.';

export const zZkpTooltip =
    'zZKP rewards are generated upon staking in the Multi-Asset Shielded Pool (MASP). Staking is not possible in the case of zero zZKP rewards.';

export const expectedPrpBalanceTooltip =
    'Privacy rewards will be given as Panther Reward Points (PRPs) in the Multi-Assets Shielded Pool and made available to exchange into $ZKP on the Core V1 launch. Rewards incentivize stronger privacy through depositing and transacting assets in the MASP. There are "realized" rewards (when PRPs have been already given) and "unrealized" ones (PRPs will be given and become "realized" upon spending a zAsset inside the MASP, in proportion to the zAsset amount and time it remained unspent). For more on privacy rewards, read the Panther Protocol documentation. Expected realized rewards only (the reward amount is subject to approval by the community) are shown on this tab. Unrealized rewards are shown on the "zAssets" tab. Please, find more details ' +
    textWithLink(
        'here',
        'https://docs.pantherprotocol.io/dao/governance/proposal-9-launch-advanced-staking-part1',
    );

export const unrealizedRewardAprTooltip =
    'Rewards will be “released” (i.e. available for exchange into $ZKP or other use) upon spending a zAsset inside the MASP. Rewards will be calculated at the APR that the community will decide on the Core V1 launch.';

export const totalUnrealizedPrivacyRewardsTooltip =
    'Rewards will be “released” (i.e. available for exchange into $ZKP or other use) upon spending a zAsset inside the MASP. Reflected rewards are calculated at the projected APR. The parameter is to be defined by the community before the Core V1 launch and can be different. Please, find more details ' +
    textWithLink(
        'here',
        'https://docs.pantherprotocol.io/dao/governance/proposal-9-launch-advanced-staking-part1',
    );

export const zAssetsPageAprTooltip =
    "Privacy rewards APR is subject to the community's decision on the Core V1 launch.";

export const balanceUpdatingTooltip =
    'Balance update pending. Balances may take a few minutes to update.';
