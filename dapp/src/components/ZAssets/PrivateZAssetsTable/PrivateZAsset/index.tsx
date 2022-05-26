import * as React from 'react';
import {useState} from 'react';

import KeyboardArrowDIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {Button} from '@mui/material';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {BigNumber} from 'ethers';

import {formatCurrency} from '../../../../lib/format';
import {calcUSDPrice} from '../../../../lib/tokenPrice';
import rightSideArrow from '../../../../images/right-arrow-icon.svg';
import pantherIcon from '../../../../images/zAssets-panther-logo.svg';
import {useAppSelector} from '../../../../redux/hooks';
import {
    advancedStakesRewardsSelector,
    totalSelector,
} from '../../../../redux/slices/advancedStakesRewards';
import {marketPriceSelector} from '../../../../redux/slices/zkpMarketPrice';
import {
    AdvancedStakeRewards,
    StakingRewardTokenID,
} from '../../../../types/staking';
import Balance from '../../Balance';
import Network from '../../Network';

import './styles.scss';

export default function PrivateZAsset() {
    const zkpPrice = useAppSelector(marketPriceSelector);
    const unclaimedZZKP = useAppSelector(
        totalSelector(StakingRewardTokenID.zZKP),
    );
    const unclaimedPRP = useAppSelector(
        totalSelector(StakingRewardTokenID.PRP),
    );
    const balanceValue = calcUSDPrice(BigNumber.from(unclaimedZZKP), zkpPrice);

    const [open, setOpen] = useState(false);
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
                    {unclaimedPRP ? formatCurrency(unclaimedPRP) : '-'} PRP
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

const AssetsDetails = () => {
    const advancedStakesRewards = useAppSelector(advancedStakesRewardsSelector);

    return (
        <Box sx={{margin: 1}}>
            <Table
                size="small"
                aria-label="purchases"
                className="staked-zAsset-table"
            >
                <TableHead>
                    <TableRow className="staked-zAsset-row">
                        <TableCell>Date:</TableCell>
                        <TableCell>Type:</TableCell>
                        <TableCell align="right">Amount:</TableCell>
                        <TableCell align="right">Rewards Earned:</TableCell>
                        <TableCell align="right">APY:</TableCell>
                        <TableCell align="right"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {advancedStakesRewards.map(
                        (asset: AdvancedStakeRewards, key: number) => (
                            <AssetsDetailsRow reward={asset} key={key} />
                        ),
                    )}
                </TableBody>
            </Table>
        </Box>
    );
};
const AssetsDetailsRow = (props: {reward: AdvancedStakeRewards}) => {
    const balance = formatCurrency(BigNumber.from(props.reward.zZKP));
    const prp = formatCurrency(BigNumber.from(props.reward.PRP));

    return (
        <TableRow key={1}>
            <TableCell component="th" scope="row" className="staking-date">
                1/19/2022
            </TableCell>
            <TableCell>
                <span className="zAsset-staking-type">Advanced Staking</span>
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {balance} zZKP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                {prp} PRP
            </TableCell>
            <TableCell align="right" className="bold-beige">
                60%
            </TableCell>
            <TableCell align="center" className="action-cell">
                <Button
                    variant="contained"
                    className="redeem-button"
                    endIcon={<img src={rightSideArrow} />}
                >
                    <span>Redeem zZKP</span>
                </Button>
            </TableCell>
        </TableRow>
    );
};
