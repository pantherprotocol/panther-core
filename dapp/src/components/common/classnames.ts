// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

type ClassNameArg = string | {[key: string]: boolean};

export function classnames(...args: ClassNameArg[]): string {
    return args
        .map((arg: ClassNameArg) => {
            if (typeof arg === 'string') return arg;

            return Object.entries<boolean>(arg)
                .map(([classname, condition]) =>
                    condition === true ? classname : '',
                )
                .join(' ')
                .trim();
        })
        .join(' ')
        .trim();
}
