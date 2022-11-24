// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

export const isObject = (obj: any) => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};
