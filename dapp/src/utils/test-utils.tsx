// test-utils.js
import React from 'react';

// eslint-disable-next-line
import {render, RenderOptions} from '@testing-library/react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';

const Wrapper: React.FC = ({children}) => (
    <Provider store={store}>{children}</Provider>
);

export const renderComponent = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: Wrapper, ...options});
