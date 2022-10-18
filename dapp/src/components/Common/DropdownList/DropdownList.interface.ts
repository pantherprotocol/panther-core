import {ReactElement} from 'react';

export interface DropdownListProps {
    setOpen: (open: boolean) => void;
    children: ReactElement[];
}
