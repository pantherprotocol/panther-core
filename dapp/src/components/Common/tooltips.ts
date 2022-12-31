function textWithLink(text: string, link: string): string {
    return `<a target="_blank" href=${link}>${text}</a>`;
}

export const prpTooltip =
    'PRPs (Panther Reward Points). This additional reward, aimed toward incentivizing Advanced Staking, will also be created in the Shielded Pool as a calculation based on the number of $zZKP for a given user. Users will be able to convert PRPs to $zZKP using the Reward Converter when the core protocol (Panther Core V1) launches. Note: there are two types of PRP - flat and accrued- with different behaviors. Please, find details on PRP in the Panther documentation.';

export const zAssetTooltip = `zZKP within the MASP. This reward is calculated based on your stake but created as a transaction inside the MASP.<br/> You will be able to redeem zZKP for ZKP using the Withdrawal option at the end of the Advanced Staking period.`;

export const zZkpTooltip =
    'zZKP rewards are generated within the MASP upon staking. Staking is not possible if there are no $zZKP rewards available.';

export const expectedPrpBalanceTooltip =
    'Privacy rewards will be awarded as Panther Reward Points (PRPs) in the Multi-Asset Shielded Pool. You will be able to exchange them for $zZKP as v1 launches. Rewards incentivize stronger privacy through depositing and transacting with assets in the MASP. Rewards are considered "Expected" when PRPs are to be rewarded in a known amount, and "Unrealized" when they are to be rewarded in an amount to be decided. For more on privacy rewards, read the Panther Protocol documentation. Only “Expected” rewards are shown on this tab. “Unrealized” rewards are shown on the "zAssets" tab. Learn more ' +
    textWithLink(
        'here',
        'https://blog.pantherprotocol.io/advanced-staking-overview',
    );

export const unrealizedRewardAprTooltip =
    'Rewards will be “released” (i.e. available for exchange into $ZKP or other use) upon spending a zAsset inside the MASP. Rewards will be calculated at the APR that the community will decide on the Core V1 launch.';

export const totalUnrealizedPrivacyRewardsTooltip =
    'Rewards will be “released” (i.e., available to exchange for $ZKP or else) upon v1’s launch. Rewards here are calculated based on a projected APR. This APR is not definitive and will be decided via a DAO vote before v1’s launch. More details ' +
    textWithLink(
        'here',
        'https://blog.pantherprotocol.io/advanced-staking-overview',
    );

export const zAssetsPageAprTooltip =
    'The displayed Privacy Rewards’ APR is not definitive and will be decided via a DAO vote before v1’s launch.';

export const balanceUpdatingTooltip =
    'Balance update pending. Balances may take a few minutes to update.';

export const privateBalanceLastSync = `Some of your assets may not be shown if you haven’t updated the page recently. A signature request will be required each time you refresh. This will not incur transaction fees and will not trigger the storage of any confidential wallet data.`;
