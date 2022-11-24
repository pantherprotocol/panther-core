// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import chalk from 'chalk';

export const orange = chalk.hex('#FFA500');

export function die(message: string): void {
    console.error(chalk.bold.red('❌ ' + message));
    process.exit(1);
}

export function warn(message: string): void {
    console.warn(orange('⚠ ' + message));
}

export function success(message: string): void {
    console.log(chalk.green('✅ ' + message));
}

export function info(message: string): void {
    console.log(chalk.blue('ℹ ' + message));
}
