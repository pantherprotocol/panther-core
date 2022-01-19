import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import WarningIcon from '@mui/icons-material/Warning';
import {Link} from '@mui/material';
import UnstakeTable from './UnstakeTable';
import InputAdornment from '@mui/material/InputAdornment';
import logo from '../../images/panther-logo.svg';
import Input from '@mui/material/Input';
import './styles.scss';
import * as stakingService from '../../services/staking';
import {useWeb3React} from '@web3-react/core';
import {useState} from 'react';
import * as accountService from '../../services/account';
import {useEffect} from 'react';
import {BigNumber} from '@ethersproject/bignumber';
import {utils} from 'ethers';

const localStorage = window.localStorage;

export default function Staking() {
    const context = useWeb3React();
    const {account, library} = context;
    const [tokenBalance, setTokenBalance] = useState<string | null>('0');
    const [stakedBalance, setStakedBalance] = useState<any>('0');
    const [amountToStake, setAmountToStake] = useState<string | null>('0');
    const [toggle, setToggle] = useState('stake');
    const [, setStakedId] = useState<number | null>(null);

    const setZkpTokenBalance = async () => {
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        const balance = await accountService.getTokenBalance(
            stakingTokenContract,
            account,
        );
        setTokenBalance(balance);
    };

    const getStakedZkpBalance = async () => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        const stakingTokenContract =
            await stakingService.getStakingTokenContract(library);
        const stakedBalance = await stakingService.getTotalStaked(
            stakingContract,
            account,
        );
        const totalStaked = BigNumber.from(0);
        stakedBalance.map(item => totalStaked.add(item.amount));
        const decimals = await stakingTokenContract.decimals();
        const totalStakedValue = utils.formatUnits(totalStaked, decimals);
        setStakedBalance((+totalStakedValue).toFixed(2));
    };

    useEffect(() => {
        setZkpTokenBalance();
        getStakedZkpBalance();
    });

    const stake = async (amount: string) => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        const stakeType = '0x4ab0941a';
        const signer = library.getSigner(account).connectUnchecked();
        const stakeId = await stakingService.stake(
            library,
            stakingContract,
            amount,
            stakeType,
            signer,
        );
        if (stakeId) {
            setStakedId(stakeId);
            localStorage.setItem('stakeId', stakeId.toString());
        }
    };

    const handleChange = (
        event: React.MouseEvent<HTMLElement>,
        newState: string,
    ) => {
        setToggle(newState);
    };

    const children = [
        <ToggleButton value="stake" key="1">
            Stake
        </ToggleButton>,
        <ToggleButton value="unstake" key="2">
            Unstake
        </ToggleButton>,
    ];

    const control = {
        value: toggle,
        onChange: handleChange,
        exclusive: true,
    };

    return (
        <Box width={'100%'} margin={'0 5'}>
            <Box
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
                sx={{
                    padding: '1rem 3rem',
                    border: '1px solid #384258',
                    borderRadius: '10px',
                    height: '90px',
                    marginBottom: '1.5rem',
                }}
            >
                <Box>
                    <Typography color={'#FFF'} fontWeight={700}>
                        {tokenBalance} <span>ZKP</span>
                    </Typography>
                    <Typography
                        variant="caption"
                        color={'#73829e'}
                        fontSize={'13px'}
                        fontWeight={400}
                    >
                        Total ZKP Balance
                    </Typography>
                </Box>
                <Box>
                    <Typography color={'#FFF'} fontWeight={700}>
                        {stakedBalance} <span>ZKP</span>
                    </Typography>
                    <Typography
                        variant="caption"
                        color={'#73829e'}
                        fontSize={'13px'}
                        fontWeight={400}
                    >
                        Staked Balance
                    </Typography>
                </Box>
                <Box>
                    <Typography color={'#FFF'} fontWeight={700}>
                        41.5%
                    </Typography>
                    <Typography
                        variant="caption"
                        color={'#73829e'}
                        fontSize={'13px'}
                        fontWeight={400}
                    >
                        Current APY
                    </Typography>
                </Box>
            </Box>
            <Card
                variant="outlined"
                sx={{
                    backgroundColor: '#2B334140',
                    borderRadius: '8px',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',

                        justifyContent: 'center',
                    }}
                >
                    <ToggleButtonGroup size="large" {...control}>
                        {children}
                    </ToggleButtonGroup>
                </Box>
                <CardContent>
                    {toggle == 'stake' && (
                        <>
                            <StakingInfoMSG />
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems={'center'}
                            >
                                <Typography
                                    sx={{
                                        opacity: 0.5,
                                    }}
                                    m={1}
                                    color={'#FFF'}
                                    fontWeight={700}
                                    variant="subtitle2"
                                    component="span"
                                >
                                    Amount to stake
                                </Typography>
                                <span>
                                    <Typography
                                        sx={{
                                            opacity: 0.5,
                                        }}
                                        m={1}
                                        color={'#FFF'}
                                        fontWeight={700}
                                        variant="subtitle2"
                                        component="span"
                                    >
                                        Available
                                    </Typography>
                                    <Typography
                                        variant="subtitle2"
                                        component="span"
                                        m={1}
                                        sx={{
                                            color: '#ffdfbd',
                                        }}
                                    >
                                        {tokenBalance}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        component="span"
                                    >
                                        ZKP
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        component="span"
                                        color="#ffdfbd"
                                        marginLeft={'1rem'}
                                        sx={{
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                            setAmountToStake(tokenBalance);
                                        }}
                                    >
                                        MAX
                                    </Typography>
                                </span>
                            </Box>
                            <Box
                                height={'70px'}
                                display={'flex'}
                                alignItems={'center'}
                                justifyContent={'space-between'}
                                padding={'16px'}
                                borderRadius={'8px'}
                                bgcolor={'#929FB759'}
                            >
                                <Input
                                    sx={{
                                        m: 2,
                                        mt: 3,
                                        border: 0,
                                        fontWeight: 600,
                                        fontSize: '24px',
                                        color: '#ffdfbd',
                                        marginInlineEnd: '16px',
                                        width: '180px',
                                    }}
                                    value={amountToStake}
                                    onChange={e => {
                                        const regex = /^[0-9\b]+$/;
                                        if (
                                            tokenBalance &&
                                            Number(tokenBalance) &&
                                            Number(e.target.value) >
                                                Number(tokenBalance) &&
                                            regex.test(e.target.value)
                                        ) {
                                            setAmountToStake(tokenBalance);
                                        } else if (regex.test(e.target.value)) {
                                            setAmountToStake(
                                                e.target.value.toString() || '',
                                            );
                                        } else {
                                            setAmountToStake('');
                                        }
                                    }}
                                    autoComplete="off"
                                    autoFocus={true}
                                    placeholder={
                                        amountToStake ? amountToStake : ''
                                    }
                                    disableUnderline={true}
                                    endAdornment={
                                        <InputAdornment
                                            position="end"
                                            sx={{
                                                fontSize: '14px',
                                                color: '#ffffff',
                                            }}
                                        >
                                            <span>ZKP</span>
                                        </InputAdornment>
                                    }
                                    aria-describedby="staking-value-helper-text"
                                />
                                <Box display={'flex'} alignItems={'center'}>
                                    <Box width={'57px'} height={'57px'}>
                                        <img src={logo} />
                                    </Box>
                                </Box>
                            </Box>
                            <Box display={'flex'} justifyContent={'center'}>
                                <StakingMethod />
                            </Box>
                        </>
                    )}
                </CardContent>

                {toggle == 'stake' && (
                    <>
                        <CardActions>
                            <Box
                                width={'96%'}
                                margin={'auto'}
                                display={'flex'}
                                alignItems={'center'}
                                justifyContent={'center'}
                                borderRadius={'10px'}
                                minHeight={'60px'}
                                sx={{backgroundColor: '#1e4eb4'}}
                            >
                                <Button
                                    sx={{
                                        color: '#fff',
                                        width: '100%',
                                    }}
                                    onClick={() => {
                                        if (
                                            amountToStake &&
                                            Number(amountToStake) > 0
                                        ) {
                                            stake(amountToStake);
                                        }
                                    }}
                                >
                                    Stake{' '}
                                    {amountToStake && Number(amountToStake) > 0
                                        ? amountToStake
                                        : ''}{' '}
                                    ZKP
                                </Button>
                            </Box>
                        </CardActions>
                    </>
                )}
                {toggle == 'unstake' && (
                    <>
                        <UnstakingInfoMSG />
                        <UnstakeTable />
                        <TotalUnclaimedRewards />
                    </>
                )}
            </Card>
        </Box>
    );
}

const StakingMethod = () => (
    <Card
        variant="outlined"
        sx={{
            borderRadius: '8px',
            background: '#6372882E',
            marginTop: '30px',
            width: '80%',
        }}
    >
        {/*<Box display="flex" justifyContent={'space-between'}>
            <Typography
                sx={{
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '42px',
                    marginRight: '18px',
                    color: '#fff',
                }}
            >
                Staking Method:
            </Typography>
            <Select
                labelId="addresses-select-standard-label"
                id="addresses-select-standard"
                variant="filled"
                value={'Standard'}
                sx={{m: 0, minWidth: 155, color: '#fff'}}
            >
                <MenuItem selected value={'Standard'}>
                    Standard
                </MenuItem>
                <MenuItem value={'Option2'}>Option2</MenuItem>
            </Select>
        </Box>*/}
        <Box display="flex" justifyContent={'space-between'}>
            <Typography
                sx={{
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '42px',
                    marginRight: '18px',
                    color: '#fff',
                }}
            >
                Estimated Gas Fee:
            </Typography>
            <Typography
                sx={{
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '42px',
                    marginRight: '18px',
                    color: '#fff',
                }}
            >
                0.0001 ETH
            </Typography>
        </Box>
    </Card>
);

const StakingInfoMSG = () => (
    <Box
        flexDirection={'column'}
        alignItems={'flex-start'}
        height={'auto'}
        textAlign={'start'}
        margin={'30px 0'}
        sx={{
            textAlign: 'start',
            border: '1px solid rgb(0 0 0 / 38 %)',
            background: '#6372882E',
            padding: '16px',
            borderRadius: '10px',
        }}
    >
        <Box display={'flex'} justifyContent={'start'} alignItems={'center'}>
            <WarningIcon
                sx={{
                    fill: 'yellow',
                    marginInlineEnd: '8px',
                    marginBottom: '20px',
                }}
            />
            <Typography
                variant="subtitle2"
                mb={3}
                fontSize={'14px'}
                fontWeight={'700'}
            >
                Staking will lock your tokens for 7+ days
            </Typography>
        </Box>
        <Typography
            variant="caption"
            color={'#73829e'}
            fontSize={'14px'}
            fontWeight={400}
        >
            You will need to unstake in order for your staked assets to be
            liquid again. This process will take 7 days to complete.&nbsp;
            <Link href="#" underline="always" color="inherit">
                Learn more
            </Link>
        </Typography>
    </Box>
);

const UnstakingInfoMSG = () => (
    <Box
        textAlign={'start'}
        padding={'16px'}
        borderRadius={'8px'}
        marginBottom={'30px'}
        bgcolor={'#6372882E'}
        sx={{opacity: 0.5}}
    >
        <Typography variant="caption">
            Stake transactions must be staking for 7+ day to be eligible to
            unstake. Rewards are claimed once a transaction is unstaked.
        </Typography>
    </Box>
);

const TotalUnclaimedRewards = () => (
    <Box display={'flex'} justifyContent={'center'} textAlign={'start'}>
        <Box
            width={'55%'}
            margin={'25px 0'}
            display={'flex'}
            justifyContent={'space-between'}
            padding={'16px'}
            borderRadius={'8px'}
            marginBottom={'30px'}
            bgcolor={'#6372882E'}
            sx={{opacity: 0.5}}
        >
            <Typography variant="caption">Total Unclaimed Rewards:</Typography>
            <Typography variant="caption">870.38 ZKP</Typography>
        </Box>
    </Box>
);
