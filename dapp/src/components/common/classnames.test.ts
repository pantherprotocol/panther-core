// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {classnames} from './classnames';

describe('classnames()', () => {
    it('classnames("foo", "bar") => "foo bar"', () => {
        const className = classnames('foo', 'bar');
        expect(className).toEqual('foo bar');
    });

    it('classnames("foo", { bar: true }) => "foo bar"', () => {
        const className = classnames('foo', {bar: true});
        expect(className).toEqual('foo bar');
    });

    it('classnames("foo", { bar: false }) => "foo"', () => {
        const className = classnames('foo', {bar: false});
        expect(className).toEqual('foo');
    });

    it('classnames({ zoo: true }, { bar: false }) => "zoo"', () => {
        const className = classnames({zoo: true}, {bar: false});
        expect(className).toEqual('zoo');
    });

    it('classnames({foo: true, bar: true}) => "foo bar"', () => {
        const className = classnames({foo: true, bar: true});
        expect(className).toEqual('foo bar');
    });
});
