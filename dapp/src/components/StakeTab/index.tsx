import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {Link} from '@mui/material';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import warningIcon from '../../images/warning-icon.svg';
import {IconButton, Tooltip} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import logo from '../../images/panther-logo.svg';
import Input from '@mui/material/Input';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import * as stakingService from '../../services/staking';
import {useWeb3React} from '@web3-react/core';
import {useState} from 'react';
import './styles.scss';

export default function StakeTab(props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    setZkpTokenBalance: any;
    getStakedZkpBalance: any;
}) {
    const context = useWeb3React();
    const {account, library} = context;
    const [amountToStake, setAmountToStake] = useState<string | null>('0.00');
    const [, setStakedId] = useState<number | null>(null);

    const stake = async (amount: string) => {
        const stakingContract = await stakingService.getStakingContract(
            library,
        );
        if (!stakingContract) {
            return;
        }
        const stakeType = '0x4ab0941a';
        const signer = library.getSigner(account).connectUnchecked();
        const stakingResponse = await stakingService.stake(
            library,
            stakingContract,
            amount,
            stakeType,
            signer,
        );
        if (stakingResponse instanceof Error) {
            //TODO: Popup notification and return data
            console.error(stakingResponse);
        }
        setStakedId(Number(stakingResponse));
        props.setZkpTokenBalance();
        props.getStakedZkpBalance();
    };

    return (
        <Box width={'100%'}>
            <StakingInput
                tokenBalance={props.tokenBalance}
                setAmountToStake={setAmountToStake}
                amountToStake={amountToStake}
            />
            <Card
                variant="outlined"
                sx={{
                    backgroundColor: '#2B334140',
                    borderRadius: '8px',
                    margin: '15px 0',
                }}
            >
                <CardContent className="staking-info-card">
                    <StakingInfoMSG />
                    <Box display={'flex'} justifyContent={'center'}>
                        <StakingMethod />
                    </Box>
                </CardContent>
            </Card>

            <StakingBtn amountToStake={amountToStake} stake={stake} />
        </Box>
    );
}

const StakingBtn = ({amountToStake, stake}) => {
    return (
        <CardActions
            sx={{
                padding: '0',
            }}
        >
            <Box
                width={'100%'}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
                borderRadius={'10px'}
                minHeight={'60px'}
                sx={{backgroundColor: '#1e4eb4'}}
            >
                <Button
                    sx={{
                        color: '#FFFFFF',
                        width: '100%',
                    }}
                    onClick={() => {
                        if (amountToStake && Number(amountToStake) > 0) {
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
    );
};

const StakingInput = props => {
    const {tokenBalance, setAmountToStake, amountToStake} = props;
    return (
        <>
            <Box
                className="amount-to-stake-card"
                display="flex"
                justifyContent="space-between"
                alignItems={'center'}
            >
                <Typography
                    m={1}
                    color={'#FFFFFF'}
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
                        color={'#FFFFFF'}
                        fontWeight={700}
                        variant="subtitle2"
                        component="span"
                    >
                        Available to stake:
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        component="span"
                        m={1}
                        sx={{
                            color: '#ffdfbd',
                            fontWeight: 700,
                        }}
                    >
                        {tokenBalance}
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        component="span"
                        sx={{
                            color: '#ffdfbd',
                            fontWeight: 700,
                        }}
                    >
                        ZKP
                    </Typography>
                </span>
            </Box>
            <Box
                height={'80px'}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'space-between'}
                padding={'16px'}
                borderRadius={'8px'}
                bgcolor={'#929FB759'}
                border={'1px solid #FFDFBD'}
            >
                <Box display={'flex'} alignItems={'center'} width={'70%'}>
                    <Box display={'flex'}>
                        <img src={logo} height={'40px'} width={'40px'} />
                    </Box>

                    <Input
                        sx={{
                            m: 2,
                            mt: 3,
                            border: 0,
                            fontWeight: 600,
                            fontSize: '24px',
                            color: '#ffdfbd',
                            marginInlineEnd: '16px',
                            marginTop: '16px',
                            width: '180px',
                        }}
                        value={amountToStake}
                        onChange={e => {
                            const regex = /^\d*\.?\d*$/; // matches floating points numbers
                            if (
                                tokenBalance &&
                                Number(tokenBalance) &&
                                Number(e.target.value) > Number(tokenBalance) &&
                                regex.test(e.target.value)
                            ) {
                                return null;
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
                        placeholder={amountToStake ? amountToStake : ''}
                        disableUnderline={true}
                        endAdornment={
                            <InputAdornment
                                position="end"
                                sx={{
                                    fontSize: '14px',
                                    color: '#FFFFFF',
                                }}
                            >
                                <span>ZKP</span>
                            </InputAdornment>
                        }
                        aria-describedby="staking-value-helper-text"
                    />
                </Box>

                <Typography
                    variant="caption"
                    component="span"
                    color="#ffdfbd"
                    fontWeight={800}
                    fontSize={16}
                    width={'20%'}
                    sx={{
                        cursor: 'pointer',
                        lineHeight: 'initial',
                    }}
                    onClick={() => {
                        setAmountToStake(tokenBalance);
                    }}
                >
                    MAX
                </Typography>
            </Box>
        </>
    );
};

const StakingMethod = () => (
    <Box
        flexDirection={'column'}
        alignItems={'flex-start'}
        height={'auto'}
        textAlign={'start'}
        width={'100%'}
        sx={{
            textAlign: 'start',
            border: '1px solid rgb(0 0 0 / 38 %)',
            background: '#6372882E',
            padding: '5px 16px',
            borderRadius: '10px',
        }}
    >
        <Box
            display="flex"
            justifyContent={'space-between'}
            alignItems={'center'}
        >
            <Typography
                className="staking-method"
                sx={{
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '42px',
                    marginRight: '18px',
                    color: '#D8D8D8',
                }}
            >
                Staking Method:
            </Typography>
            <Select
                labelId="addresses-select-standard-label"
                id="addresses-select-standard"
                variant="standard"
                value={'Standard'}
                sx={{
                    m: 0,
                    minWidth: 125,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    marginTop: '0px',
                }}
            >
                <MenuItem selected value={'Standard'}>
                    Standard
                </MenuItem>
                <MenuItem value={'Advanced'} disabled={true}>
                    Advanced
                </MenuItem>
            </Select>
        </Box>
        <Box display="flex" justifyContent={'space-between'}>
            <Typography
                sx={{
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '42px',
                    marginRight: '18px',
                    color: '#D8D8D8',
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
                    color: '#FFFFFF',
                }}
            >
                0.0001 ETH
            </Typography>
        </Box>
    </Box>
);

const StakingInfoMSG = () => (
    <Box
        flexDirection={'column'}
        alignItems={'flex-start'}
        height={'auto'}
        textAlign={'start'}
        sx={{
            textAlign: 'start',
            padding: ' 5px 4px',
            paddingBottom: '20px',
        }}
    >
        <Box
            display={'flex'}
            justifyContent={'start'}
            alignItems={'center'}
            sx={{
                paddingBottom: '20px',
            }}
        >
            <Tooltip title={'warning'} placement="top">
                <IconButton
                    sx={{
                        opacity: 0.6,
                        marginInlineEnd: '8px',
                        marginBottom: '24px',
                    }}
                >
                    <img src={warningIcon} />
                </IconButton>
            </Tooltip>

            <Typography variant="subtitle2" mb={3}>
                Staking will lock your tokens for 7+ days
            </Typography>
        </Box>
        <Typography
            variant="caption"
            color={'#D8D8D8'}
            fontSize={'14px'}
            fontWeight={400}
            paddingBottom={'10px'}
        >
            You will need to unstake in order for your staked assets to be
            liquid again. This process will take 7 days to complete.{' '}
            <Link
                href="https://docs.pantherprotocol.io/"
                underline="always"
                color="inherit"
            >
                Learn more
            </Link>
        </Typography>
    </Box>
);
