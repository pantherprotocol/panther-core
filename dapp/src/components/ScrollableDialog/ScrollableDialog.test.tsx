// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderComponent} from 'components/common/test-utils';

import ScrollableDialog from './index';

const testTitle = 'test';
const testCloseHandler = jest.fn();

test('should render correctly with props', () => {
    const {getByText} = renderComponent(
        <ScrollableDialog title={testTitle} handleClose={testCloseHandler} />,
    );

    waitFor(() => {
        expect(getByText('test')).toBeTruthy();
        userEvent.click(getByText(/close/i));
        expect(testCloseHandler).toHaveBeenCalledTimes(1);
    });
});
