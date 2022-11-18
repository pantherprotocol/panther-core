import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import Balance from 'components/ZAssets/Balance';
import Network from 'components/ZAssets/Network';
import AssetsDetails from 'components/ZAssets/PrivateZAssetsTable/AssetsDetailsTable';
import pantherIcon from 'images/zAssets-panther-logo.svg';
import {formatCurrency} from 'lib/format';
import {calcUSDPrice} from 'lib/token-price';
import {useAppSelector} from 'redux/hooks';
import {zkpMarketPriceSelector} from 'redux/slices/marketPrices/zkp-market-price';
import {totalSelector} from 'redux/slices/wallet/advanced-stakes-rewards';
import {StakingRewardTokenID} from 'types/staking';

import './styles.scss';

export default function PrivateZAssetRow() {
    const {account, chainId} = useWeb3React();
    const zkpPrice = useAppSelector(zkpMarketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.zZKP),
    );
    const unclaimedPRP = useAppSelector(
        totalSelector(chainId, account, StakingRewardTokenID.PRP),
    );
    const balanceValue = calcUSDPrice(unclaimedZZKP, zkpPrice);

    const [open, setOpen] = useState(true);
    return (
        <React.Fragment>
            <TableRow
                className="private-zAsset-row"
                sx={{'& > *': {borderBottom: 'unset'}}}
            >
                <TableCell className="expand-icon">
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? (
                            <KeyboardArrowDIcon />
                        ) : (
                            <KeyboardArrowRightIcon />
                        )}
                    </IconButton>
                </TableCell>
                <TableCell
                    component="th"
                    scope="row"
                    align="left"
                    className="logo-cell"
                >
                    <img src={pantherIcon} />
                </TableCell>
                <TableCell align="right">
                    <Balance
                        balance={
                            unclaimedZZKP ? formatCurrency(unclaimedZZKP) : '-'
                        }
                        name={StakingRewardTokenID.zZKP}
                        balanceValue={balanceValue}
                    />
                </TableCell>
                <TableCell align="left">
                    <Network networkName={'Polygon zAsset'} />
                </TableCell>
                <TableCell align="left" className="prp">
                    {unclaimedPRP
                        ? formatCurrency(unclaimedPRP, {scale: 0})
                        : '-'}{' '}
                    PRP
                </TableCell>
            </TableRow>
            <TableRow className="private-zAsset-row">
                <TableCell
                    style={{paddingBottom: 0, paddingTop: 0}}
                    colSpan={6}
                >
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <AssetsDetails />
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}
