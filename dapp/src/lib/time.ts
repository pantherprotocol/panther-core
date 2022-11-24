// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
