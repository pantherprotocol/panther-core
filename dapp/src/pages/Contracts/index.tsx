import React, {useCallback, useEffect, useState} from 'react';

import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import {addressLink, SafeLink} from 'components/Common/links';
import {MainPageWrapper} from 'components/MainPageWrapper';
import {supportedNetworks} from 'services/connectors';
import {
    ContractName,
    getContractAddress,
    hasContract,
} from 'services/contracts';

import './styles.scss';

const ContractsPage = () => {
    const context = useWeb3React();
    const {chainId} = context;

    const [contracts, setContracts] = useState<object[]>([]);

    const loadContracts = useCallback(() => {
        const contractsArr: object[] = [];

        const values = Object.values(ContractName);
        const contractNames: any = values.filter(
            contractName => typeof contractName === 'string',
        );
        contractNames.map((cName: any) => {
            const hasContractAddress = hasContract(
                ContractName[cName] as unknown as ContractName,
                chainId!,
            );
            if (hasContractAddress) {
                const address = getContractAddress(
                    ContractName[cName] as unknown as ContractName,
                    chainId!,
                );
                const url = addressLink(chainId!, address);

                const contractsObject = {
                    name: cName,
                    address: address,
                    url: url,
                };
                contractsArr.push(contractsObject);
            }
        });

        setContracts(contractsArr);
    }, [chainId]);

    useEffect(() => {
        loadContracts();
    }, [loadContracts]);

    return (
        <Box className="contracts-page-container">
            <MainPageWrapper>
                <Typography className="table-title">
                    {chainId
                        ? `Contracts on ${supportedNetworks[chainId!]?.name}`
                        : 'Please Connect Your Wallet!'}
                </Typography>
                <TableContainer
                    component={Paper}
                    className="contracts-table-container"
                >
                    <Table
                        sx={{minWidth: 650}}
                        aria-label="simple table"
                        className="contracts-table"
                    >
                        <TableHead>
                            {chainId && (
                                <TableRow>
                                    <TableCell>
                                        <Typography className="table-head">
                                            Contract Name
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography className="table-head">
                                            Contract Address
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableHead>
                        <TableBody>
                            {contracts &&
                                contracts.map((row: any) => (
                                    <TableRow
                                        key={row.name}
                                        sx={{
                                            '&:last-child td, &:last-child th':
                                                {
                                                    border: 0,
                                                },
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.name}
                                        </TableCell>
                                        <TableCell
                                            className="contract-address"
                                            align="right"
                                        >
                                            <SafeLink href={row.url}>
                                                {row.address}
                                            </SafeLink>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </MainPageWrapper>
        </Box>
    );
};

export default ContractsPage;
