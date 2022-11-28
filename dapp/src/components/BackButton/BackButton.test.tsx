// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/Common/test-utils';

import BackButton from './index';

test('should render', async () => {
    const handleClick = jest.fn();
    renderComponent(<BackButton onClick={handleClick} />);
    const backButtonHolder = screen.queryByTestId(
        'back-button_back-button_holder',
    );
    await waitFor(() => expect(backButtonHolder).toBeInTheDocument());
});

test('click on button should trigger onClick event', async () => {
    const handleClick = jest.fn();
    renderComponent(<BackButton onClick={handleClick} />);

    const backButton = screen.queryByTestId('back-button_back-button_icon');

    await waitFor(() => expect(backButton).toBeInTheDocument());
    await (backButton && fireEvent.click(backButton));
    await waitFor(() => expect(handleClick).toBeCalled());
});
