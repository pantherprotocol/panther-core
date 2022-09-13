import {ReactElement} from 'react';

export interface PrimaryActionButtonProps {
    onClick?: any;
    styles?: string;
    disabled?: boolean;
    children: string | ReactElement;
    dataTestid?: string;
}
