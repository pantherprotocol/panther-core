import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {hash4bytes} from '../../lib/hash';

import {ERC20} from './../../types/contracts/ERC20';
import {Staking} from './../../types/contracts/Staking';

const TASK_STAKING_ADD_STAKE = 'staking:add:stake';

task(TASK_STAKING_ADD_STAKE, 'Adding fake stakes to the Staking contract')
    .addParam('staking', 'The address of the Staking contract address')
    .addParam('token', 'The address of the staking token contract')
    .addParam('count', 'Number of stakes to be created', '100')
    .addParam('type', 'Staking type, can be advanced or classic')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        if (!(taskArgs.type === 'advanced' || taskArgs.type === 'classic'))
            throw new Error(
                'Invaid type. Try use one of the `advanced` or `classic` values',
            );
        const [staker] = await hre.ethers.getSigners();

        // Create staking contract instance
        const {abi: stakingAbi} = await hre.artifacts.readArtifact('Staking');
        const staking = (await hre.ethers.getContractAt(
            stakingAbi,
            taskArgs.staking,
        )) as Staking;

        // Create token contract instance
        const {abi: tokenAbi} = await hre.artifacts.readArtifact('ERC20');
        const token = (await hre.ethers.getContractAt(
            tokenAbi,
            taskArgs.token,
        )) as ERC20;

        const stakingType = hash4bytes(taskArgs.type);

        const {minAmountScaled} = await staking.terms(stakingType);
        const minAmountUnscaled = hre.ethers.utils.parseEther(
            minAmountScaled.toString(),
        );
        const maxStakingAmount = minAmountUnscaled.mul(taskArgs.count);

        const allowance = await token.allowance(
            staker.address,
            staking.address,
        );
        const balanceOfStaker = await token.balanceOf(staker.address);

        if (maxStakingAmount.gt(balanceOfStaker)) {
            throw new Error(
                `The staker account does not have enough token, The total needed amount is ${maxStakingAmount.toString()} but the staker has ${balanceOfStaker.toString()} token`,
            );
        }

        if (maxStakingAmount.gt(allowance)) {
            console.log('Approving Staking to spend the token...');
            const tx = await token.approve(
                taskArgs.staking,
                hre.ethers.constants.MaxUint256,
            );
            const receipt = await tx.wait();
            console.log(
                'Staking contract is approved',
                receipt.transactionHash,
            );
        }

        const data =
            taskArgs.type === 'advanced'
                ? '0x3061000000000000000000000000000000000000000000000000000000001063101000000000000000000000000000000000000000000000000000000000010130620000000000000000000000000000000000000000000000000000000020632020000000000000000000000000000000000000000000000000000000000202fffe00000000000000000000000000066000000000000000000000000000feeefffe00000000000000000000000000077000000000000000000000000000feeefffe00000000000000000000000000099000000000000000000000000000feeefffe000000000000000000000000000aa000000000000000000000000000feee'
                : '0x00';

        console.log(`Start creating ${taskArgs.count} stakes...`);

        let skipped = 0;

        for (let i = 0; i < +taskArgs.count; i++) {
            try {
                const tx = await staking.stake(
                    minAmountUnscaled,
                    stakingType,
                    data,
                );
                console.log(`Stake number ${i} is created, ${tx.hash}`);
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                console.log(`Error..., skipping the tx number ${i}`);
                skipped++;
            }
        }

        console.log(`${taskArgs.count} stakes were tried to be created.`);
        if (skipped > 0)
            console.log(`${skipped} of them were skipped due to an error.`);
    });
