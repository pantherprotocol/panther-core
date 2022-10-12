import React from 'react';

import {Select} from '@mui/material';

import {DropdownListProps} from './DropdownList.interface';

import './styles.scss';

function DropdownList(props: DropdownListProps) {
    return (
        <Select
            labelId="dropdown-list-button-label"
            className="dropdown-list"
            variant="filled"
            onOpen={() => props.setOpen(true)}
            onClose={() => props.setOpen(false)}
        >
            {props.children}
        </Select>
    );
}

export default DropdownList;
