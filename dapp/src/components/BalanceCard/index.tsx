import * as React from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import ethLogo from '../../images/eth-logo.svg';
import infoIcon from '../../images/info-icon.svg';
import refreshIcon from '../../images/refresh-icon.svg';
// import settingIcon from '../../images/setting-icon.svg';
import accountAvatar from '../../images/wallet-icon.svg';
import {formatUSDPrice} from '../../services/account';
import {formatCurrency} from '../../utils';
import Address from '../Address';

import './styles.scss';

const BalanceCard = (props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    tokenBalanceUSD: string | null;
    pricePerToken: number | null;
    accountAddress: string | null;
}) => {
    const stakedUSDValue: string | null =
        props.stakedBalance && props.pricePerToken
            ? formatUSDPrice(
                  (
                      props.pricePerToken * Number(props.stakedBalance)
                  ).toString(),
              )
            : '';
    const rewardsUSDValue: string | null =
        props.rewardsBalance && props.pricePerToken
            ? formatUSDPrice(
                  (
                      props.pricePerToken * Number(props.rewardsBalance)
                  ).toString(),
              )
            : '';

    return (
        <>
            <Card className="balance-card">
                {props.accountAddress && (
                    <AddressWithSetting
                        accountAvatar={accountAvatar}
                        accountAddress={props.accountAddress}
                    />
                )}
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
                    balance={props.stakedBalance}
                    amountUSD={stakedUSDValue}
                />

                <AddressBalances
                    title={'Unclaimed Reward Balance'}
                    balance={props.rewardsBalance}
                    amountUSD={rewardsUSDValue}
                />
            </Card>
        </>
    );
};

const AddressWithSetting = (props: {
    accountAvatar: string;
    accountAddress: string | null;
}) => {
    return (
        <Box className="address-with-setting">
            <Box className="address">
                <Address
                    accountAvatar={props.accountAvatar}
                    accountAddress={props.accountAddress}
                />
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

const TotalBalance = ({title, tooltip, tokenBalance, tokenMarketPrice}) => {
    const refreshPage = () => {
        window.location.reload();
    };

    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">{title}</Typography>
                {false && tooltip && (
                    <Tooltip title={tooltip} placement="top">
                        <IconButton>
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title={'Click to refresh balances'} placement="top">
                    <IconButton onClick={refreshPage}>
                        <img src={refreshIcon} />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box className="amount-box">
                <Typography component="div" className="token-balance">
                    {tokenBalance ? formatCurrency(tokenBalance) : '-'}
                </Typography>
                <Typography className="zkp-symbol main-symbol">ZKP</Typography>
            </Box>
            {tokenMarketPrice && (
                <Box className="amount-box">
                    <Typography className="token-market-price">
                        {tokenMarketPrice
                            ? `~$ ${formatCurrency(tokenMarketPrice)} USD`
                            : '-'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

const AddressBalances = props => {
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
