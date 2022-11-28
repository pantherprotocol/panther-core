// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/Common/test-utils';

import {MoreItems} from './index';

test('should render', () => {
    renderComponent(<MoreItems />);
    const moreItems = screen.queryByTestId('more-items_wrapper');
    waitFor(() => expect(moreItems).toBeInTheDocument());
});
