// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import 'isomorphic-fetch';

type FetchParams = Parameters<typeof fetch>;
type MockFetch = jest.Mock<Promise<Response>, FetchParams>;
declare global {
    function mockFetch<T>(response: T, statusCode?: number): MockFetch;
    function mockGeoLocationRes(): MockFetch;
}

global.mockFetch = <T>(response: T, statusCode = 200) =>
    jest.fn<Promise<Response>, FetchParams>().mockImplementation(
        async () =>
            new Response(JSON.stringify(response), {
                status: statusCode,
            }),
    );

global.mockGeoLocationRes = (): MockFetch =>
    global.mockFetch({
        country: 'NL',
        country_name: 'Netherlands',
        ip: '109.236.80.164',
    });
