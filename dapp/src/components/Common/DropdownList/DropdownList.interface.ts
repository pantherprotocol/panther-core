// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {ReactElement} from 'react';

export interface DropdownListProps {
    setOpen: (open: boolean) => void;
    children: ReactElement[];
}
