import * as React from 'react';
import {ReactElement} from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import {BigNumber} from 'ethers';

import ethLogo from '../../images/eth-logo.svg';
import infoIcon from '../../images/info-icon.svg';
import {useAppSelector} from '../../redux/hooks';
import {marketPriceSelector} from '../../redux/slices/zkpMarketPrice';
import {
    zkpStakedBalanceSelector,
    zkpUSDStakedBalanceSelector,
} from '../../redux/slices/zkpStakedBalance';
import {fiatPrice, formatCurrency} from '../../utils/helpers';
import Address from '../Address';

import './styles.scss';

const BalanceCard = (props: {
    rewardsBalance: BigNumber | null;
    tokenBalance: BigNumber | null;
    tokenBalanceUSD: BigNumber | null;
    accountAddress: string | null;
    networkLogo: string | undefined;
}) => {
    const stakedBalance = useAppSelector(zkpStakedBalanceSelector);
    const stakedUSDValue: BigNumber | null = useAppSelector(
        zkpUSDStakedBalanceSelector,
    );
    const pricePerToken = useAppSelector(marketPriceSelector);

    const rewardsUSDValue: BigNumber | null = fiatPrice(
        props.rewardsBalance,
        pricePerToken,
    );

    return (
        <Box className="balance-card-holder">
            <Card className="balance-card">
                {props.accountAddress && <AddressWithSetting />}
                {!props.accountAddress && (
                    <div className="not-connected-balance-container">
                        <IconButton>
                            <img src={ethLogo} />
                        </IconButton>
                        <Typography
                            component="div"
                            className="token-balance balance-not-connected"
                        >
                            Connect wallet
                        </Typography>
                    </div>
                )}
                <TotalBalance
                    title={'Unstaked Balance'}
                    tooltip={
                        'This is the amount of ZKP you have available for staking.'
                    }
                    tokenBalance={props.tokenBalance}
                    tokenMarketPrice={props.tokenBalanceUSD}
                />

                <AddressBalances
                    title={'Staked Balance'}
                    tooltip={'This is the total amount you have staked so far.'}
                    balance={stakedBalance}
                    amountUSD={stakedUSDValue}
                />
                <AddressBalances
                    title={'Unclaimed Reward Balance'}
                    balance={props.rewardsBalance}
                    amountUSD={rewardsUSDValue}
                />
            </Card>
        </Box>
    );
};

const AddressWithSetting = () => {
    return (
        <Box className="address-with-setting">
            <Box className="address">
                <Address />
            </Box>
            {/*<Box className="setting-icon">
                <Tooltip title="Settings" placement="top">
                    <IconButton>
                        <img src={settingIcon} />
                    </IconButton>
                </Tooltip>
            </Box>*/}
        </Box>
    );
};

const TotalBalance = (props: {
    title: string | null;
    tooltip: string;
    tokenBalance: BigNumber | null;
    tokenMarketPrice: BigNumber | null;
}): ReactElement => {
    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">{props.title}</Typography>
                {false && props.tooltip && (
                    <Tooltip title={props.tooltip} placement="top">
                        <IconButton>
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Box className="amount-box">
                <Typography component="div" className="token-balance">
                    {props.tokenBalance
                        ? formatCurrency(props.tokenBalance)
                        : '-'}
                </Typography>
                <Typography className="zkp-symbol main-symbol">ZKP</Typography>
            </Box>
            {props.tokenMarketPrice && (
                <Box className="amount-box">
                    <Typography className="token-market-price">
                        {props.tokenMarketPrice
                            ? `~$ ${formatCurrency(props.tokenMarketPrice)} USD`
                            : '-'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

const AddressBalances = (props: {
    title: string;
    tooltip?: string;
    amountUSD: BigNumber | null;
    balance: BigNumber | null;
}) => {
    const {title, tooltip, amountUSD, balance} = props;

    return (
        <Box className="address-balance">
            <Box className="title-box">
                <Typography className="title">{title}</Typography>
                <Typography>
                    {tooltip && (
                        <Tooltip title={tooltip} placement="top">
                            <IconButton>
                                <img src={infoIcon} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Typography>
            </Box>

            <Box className="amount-box">
                <Box className="balance-box">
                    <Typography className="balance" component="div">
                        {balance ? formatCurrency(balance) : '-'}
                    </Typography>
                    <Typography className="zkp-symbol">ZKP</Typography>
                </Box>
                {amountUSD && (
                    <Typography className="amount-usd">
                        {`~$ ${formatCurrency(amountUSD)} USD`}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default BalanceCard;
