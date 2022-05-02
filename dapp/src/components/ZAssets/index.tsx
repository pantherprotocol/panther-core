import * as React from 'react';

import {ZAsset} from '../../services/assets';

import PrivateBalance from './PrivateBalance';
import PrivateZAssetsTable from './PrivateZAssetsTable';
import PublicAssetsTable from './PublicAssetsTable';

import './styles.scss';

export default function ZAssets(props: {assets: ZAsset[]}) {
    return (
        <div className="assets-holder">
            <div className="assets-container">
                <PrivateBalance />
                <PrivateZAssetsTable assets={props.assets} />
                <PublicAssetsTable assets={props.assets} />
            </div>
        </div>
    );
}
