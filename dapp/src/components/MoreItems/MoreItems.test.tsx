import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';

import {renderComponent} from '../../utils/test-utils';

import {MoreItems} from './index';

test('should render', () => {
    renderComponent(<MoreItems />);
    const moreItems = screen.queryByTestId('more-items_wrapper');
    waitFor(() => expect(moreItems).toBeInTheDocument());
});
