import React, {ReactElement} from 'react';

import {Select} from '@mui/material';

import './styles.scss';

function DropdownList(props: {
    setOpen: (open: boolean) => void;
    children: ReactElement[];
}) {
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
