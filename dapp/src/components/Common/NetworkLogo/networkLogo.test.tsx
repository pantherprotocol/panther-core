import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';

import {renderComponent} from '../../../utils/test-utils';

import {networkLogo} from './index';

test('should render img element correctly', async () => {
    const testLogoName = 'MATIC';
    const testAltText = 'testAltText';

    renderComponent(<img src={networkLogo(testLogoName)} alt={testAltText} />);

    const networkLogoIMG = screen.getByAltText(testAltText);

    await waitFor(() => expect(networkLogoIMG).toBeInTheDocument());
});
