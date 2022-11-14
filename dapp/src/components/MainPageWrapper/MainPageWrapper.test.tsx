import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {BrowserRouter as Router} from 'react-router-dom';
import {renderComponent} from 'utils/test-utils';

import {MainPageWrapper} from './index';

test('should render the MainPageWrapper with its child element', () => {
    const mainPageWrapper = screen.queryByTestId(
        'main-page-wrapper_main-page-wrapper_container',
    );
    const mainPageWrapperChild = screen.queryByTestId(
        'main-page-wrapper_main-page-wrapper_child',
    );
    renderComponent(
        <Router>
            <MainPageWrapper>{mainPageWrapperChild}</MainPageWrapper>
        </Router>,
    );

    waitFor(() => {
        expect(mainPageWrapperChild).toBeInTheDocument();
        expect(mainPageWrapper).toContainElement(mainPageWrapperChild);
    });
});
