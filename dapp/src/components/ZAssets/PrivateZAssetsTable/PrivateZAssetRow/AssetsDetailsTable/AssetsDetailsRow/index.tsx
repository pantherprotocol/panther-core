import * as React from 'react';
import {useCallback} from 'react';

import {Button, Typography, Box} from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import {BigNumber, utils} from 'ethers';

import rightSideArrow from '../../../../../../images/right-arrow-icon.svg';
import {
    formatCurrency,
    formatPercentage,
    formatTime,
} from '../../../../../../lib/format';
import {useAppDispatch, useAppSelector} from '../../../../../../redux/hooks';
import {updateUTXOStatus} from '../../../../../../redux/slices/advancedStakesRewards';
import {termsSelector} from '../../../../../../redux/slices/stakeTerms';
import {exit} from '../../../../../../services/pool';
import {getAdvStakingAPY} from '../../../../../../services/rewards';
import {AdvancedStakeRewards, StakeType} from '../../../../../../types/staking';

import './styles.scss';

const AssetsDetailsRow = (props: {rewards: AdvancedStakeRewards}) => {
    const context = useWeb3React();
    const {library, account, chainId} = context;

    const dispatch = useAppDispatch();

    const balance = formatCurrency(BigNumber.from(props.rewards.zZKP));
    const prp = formatCurrency(utils.parseEther(props.rewards.PRP));
    const advancedStakingAPY = getAdvStakingAPY(
        Number(props.rewards.creationTime) * 1000,
    );
    const lockedTill = useAppSelector(
        termsSelector(chainId!, StakeType.Advanced, 'lockedTill'),
    );

    const redeem = useCallback(async () => {
        const utxoStatus = await exit(
            library,
            account as string,
            chainId as number,
            props.rewards.utxoData,
            BigInt(props.rewards.id),
            Number(props.rewards.creationTime),
            props.rewards.commitments,
        );
        dispatch(updateUTXOStatus, [account, props.rewards.id, utxoStatus]);
    }, [dispatch, library, account, chainId, props.rewards]);

    const isRedemptionPossible =
        lockedTill && Number(lockedTill) * 1000 < Date.now();

    const redeemButton = (
        <Button
            className="redeem-button"
            variant="contained"
            endIcon={isRedemptionPossible ? <img src={rightSideArrow} /> : null}
            disabled={!isRedemptionPossible}
            onClick={() => redeem()}
        >
            {isRedemptionPossible ? (
                'Redeem zZKP'
            ) : (
                <Box>
                    <Typography>Locked Until:</Typography>
                    <Typography>
                        {formatTime(Number(lockedTill) * 1000, {
                            style: 'short',
                        })}
                    </Typography>
                </Box>
            )}
        </Button>
    );

    return (
        <TableRow key={props.rewards.id}>
            <TableCell component="th" scope="row" className="staking-date">
                {formatTime(Number(props.rewards.creationTime) * 1000, {
                    style: 'short',
                })}
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
                {formatPercentage(advancedStakingAPY / 100)}
            </TableCell>
            <TableCell align="center">{redeemButton}</TableCell>
        </TableRow>
    );
};

export default AssetsDetailsRow;
