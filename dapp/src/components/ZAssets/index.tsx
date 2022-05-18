import * as React from 'react';

import PrivateBalance from './PrivateBalance';
import PrivateZAssetsTable from './PrivateZAssetsTable';

import './styles.scss';

export default function ZAssets() {
    return (
        <div className="assets-holder">
            <div className="assets-container">
                <PrivateBalance />
                <PrivateZAssetsTable />
            </div>
        </div>
    );
}
