import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';

import pantherIcon from '../../../../images/zAssets-panther-logo.svg';
import {formatCurrency} from '../../../../lib/format';
import {calcUSDPrice} from '../../../../lib/tokenPrice';
import {useAppSelector} from '../../../../redux/hooks';
import {totalSelector} from '../../../../redux/slices/advancedStakesRewards';
import {marketPriceSelector} from '../../../../redux/slices/zkpMarketPrice';
import {StakingRewardTokenID} from '../../../../types/staking';
import Balance from '../../Balance';
import Network from '../../Network';
import AssetsDetails from '../AssetsDetailsTable';

import './styles.scss';

export default function PrivateZAssetRow() {
    const {account, chainId} = useWeb3React();
    const zkpPrice = useAppSelector(marketPriceSelector);
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
                <TableCell align="left" className="bold-beige ">
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
