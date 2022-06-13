import * as React from 'react';
import {useCallback} from 'react';

import {Button} from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {useWeb3React} from '@web3-react/core';
import {BigNumber} from 'ethers';

import rightSideArrow from '../../../../../../images/right-arrow-icon.svg';
import {formatCurrency, formatTime} from '../../../../../../lib/format';
import {useAppDispatch} from '../../../../../../redux/hooks';
import {markRewardsAsSpent} from '../../../../../../redux/slices/advancedStakesRewards';
import {exit} from '../../../../../../services/pool';
import {AdvancedStakeRewards} from '../../../../../../types/staking';

import './styles.scss';

const AssetsDetailsRow = (props: {rewards: AdvancedStakeRewards}) => {
    const context = useWeb3React();
    const {library, account, chainId} = context;

    const dispatch = useAppDispatch();

    const balance = formatCurrency(BigNumber.from(props.rewards.zZKP));
    const prp = formatCurrency(BigNumber.from(props.rewards.PRP));

    const redeem = useCallback(async () => {
        const utxoIsSpent = await exit(
            library,
            account as string,
            chainId as number,
            props.rewards.utxoData,
            BigInt(props.rewards.id),
            Number(props.rewards.creationTime),
            props.rewards.commitments,
        );
        if (utxoIsSpent) {
            dispatch(markRewardsAsSpent, props.rewards.id);
        }
    }, [dispatch, library, account, chainId, props.rewards]);

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
                60%
            </TableCell>
            <TableCell align="center">
                <Button
                    variant="contained"
                    className="redeem-button"
                    endIcon={<img src={rightSideArrow} />}
                    onClick={() => redeem()}
                >
                    <span>Redeem zZKP</span>
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default AssetsDetailsRow;
