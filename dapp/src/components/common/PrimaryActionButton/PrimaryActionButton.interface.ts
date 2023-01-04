// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {ReactElement} from 'react';

export interface PrimaryActionButtonProps {
    onClick?: any;
    styles?: string;
    disabled?: boolean;
    children: string | ReactElement;
    dataTestid?: string;
}
