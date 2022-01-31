import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import refreshIcon from '../../images/refresh-icon.svg';
import infoIcon from '../../images/info-icon.svg';
import settingIcon from '../../images/setting-icon.svg';
import {IconButton, Tooltip} from '@mui/material';
import Address from '../Address';
import accountAvatar from '../../images/wallet-icon.svg';
import './styles.scss';

const BalanceCard = (props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    tokenUSDValue: string | null;
    accountAddress: string | null;
}) => {
    return (
        <>
            <Card className="balance-card">
                {props.accountAddress && (
                    <AddressWithSetting
                        accountAvatar={accountAvatar}
                        accountAddress={props.accountAddress}
                    />
                )}

                <TotalBalance
                    title={'Total Balance'}
                    tokenBalance={props.tokenBalance}
                    tokenMarketPrice={props.tokenUSDValue}
                />

                <AddressBalances
                    title={'Staked Balance'}
                    balance={props.stakedBalance}
                    amountUSD={props.tokenUSDValue}
                />

                <AddressBalances
                    title={'Unclaimed Reward Balance'}
                    balance={props.rewardsBalance}
                    amountUSD={props.tokenUSDValue}
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
            <Box className="setting-icon">
                <Tooltip title="Settings" placement="top">
                    <IconButton>
                        <img src={settingIcon} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};

const TotalBalance = ({title, tokenBalance, tokenMarketPrice}) => {
    const refreshPage = () => {
        window.location.reload();
    };

    return (
        <Box className="total-balance">
            <Box className="title-box">
                <Typography className="title">{title}</Typography>
                <Tooltip title={title} placement="top">
                    <IconButton onClick={refreshPage}>
                        <img src={refreshIcon} />
                    </IconButton>
                </Tooltip>
            </Box>

            {account && (
                <>
                    <Box className="amount-box">
                        <Typography component="div" className="token-balance">
                            {tokenBalance}
                        </Typography>
                        <Typography className="zkp-symbol">ZKP</Typography>
                    </Box>
                    {tokenMarketPrice && (
                        <Box className="amount-box">
                            <Typography className="token-market-price">
                                {`~$ ${tokenMarketPrice} USD`}
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

const AddressBalances = props => {
    const {title, amountUSD, balance} = props;

    return (
        <Box className="address-balance">
            <Box className="title-box">
                <Typography className="title">{title}</Typography>
                <Typography>
                    <Tooltip title={title} placement="top">
                        <IconButton>
                            <img src={infoIcon} />
                        </IconButton>
                    </Tooltip>
                </Typography>
            </Box>

            {account && (
                <Box className="amount-box">
                    <Box className="balance-box">
                        <Typography className="balance" component="div">
                            {balance}
                        </Typography>
                        <Typography className="zkp-symbol">ZKP</Typography>
                    </Box>
                    {amountUSD && (
                        <Typography className="amount-usd">
                            {`~$ ${amountUSD} USD`}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default BalanceCard;
