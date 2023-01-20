// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';
import {NetworkSymbol} from 'services/connectors';

import {networkLogo} from './index';

test('should render img element correctly', async () => {
    const testAltText = 'testAltText';
    renderComponent(
        <img src={networkLogo(NetworkSymbol.MATIC)} alt={testAltText} />,
    );

    const networkLogoIMG = screen.getByAltText(testAltText);

    await waitFor(() => expect(networkLogoIMG).toBeInTheDocument());
});
