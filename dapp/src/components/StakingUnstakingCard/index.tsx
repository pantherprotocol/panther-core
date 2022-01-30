import * as React from 'react';
import {useState} from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import StakeTab from '../../components/StakeTab';
import UnstakingTab from '../../components/UnstakeTab';
import './styles.scss';

export default function StakingUnstakingCard(props: {
    rewardsBalance: string | null;
    tokenBalance: string | null;
    stakedBalance: string | null;
    setZkpTokenBalance: any;
    getStakedZkpBalance: any;
    onConnect: any;
    switchNetwork: any;
}) {
    const [toggle, setToggle] = useState('stake');

    const handleChange = (
        event: React.MouseEvent<HTMLElement>,
        newState: string,
    ) => {
        if (newState !== null) {
            setToggle(newState);
            console.log(newState, 'is the new state');
        }
    };

    const children = [
        <ToggleButton value="stake" key="1">
            Stake ZKP
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
            <Card
                variant="outlined"
                sx={{
                    backgroundColor: '#2B334140',
                    borderRadius: '8px',
                    padding: '0',
                }}
            >
                <Box>
                    <ToggleButtonGroup size="large" {...control}>
                        {children}
                    </ToggleButtonGroup>
                </Box>

                <CardContent>
                    {toggle == 'stake' || toggle == null ? (
                        <StakeTab
                            tokenBalance={props.tokenBalance}
                            stakedBalance={props.stakedBalance}
                            rewardsBalance={props.rewardsBalance}
                            setZkpTokenBalance={props.setZkpTokenBalance}
                            getStakedZkpBalance={props.getStakedZkpBalance}
                            onConnect={props.onConnect}
                            switchNetwork={props.switchNetwork}
                        />
                    ) : (
                        <UnstakingTab rewardsBalance={props.rewardsBalance} />
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
