// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {BLOCKED_COUNTRIES} from 'services/env';
import {safeFetch} from 'services/http';

type IIpApi = {
    country: string;
    country_name: string;
    ip: string;
};
type IGeoLocationDB = {
    country_code: string;
    country_name: string;
    IPv4: string;
};

type ApiResponse = IIpApi | IGeoLocationDB;

type Location = {
    country: string;
    country_name: string;
    ip: string;
};

const GEO_LOCATION_APIS = [
    'https://geolocation-db.com/json/',
    'https://ipapi.co/json',
];

export async function fetchLocation(): Promise<Location | Error> {
    // this will hold the latest error, and will be returned
    // if no valid response recived.
    // default error message will be returned if all endpoints
    // returned  unvalid response (i.e: not a location)
    let error: Error = new Error('No endpoint returned a valid response');

    const shuffledApis = GEO_LOCATION_APIS.sort(() => 0.5 - Math.random());

    for (const url of shuffledApis) {
        const response = await safeFetch(url);
        if (response instanceof Error) {
            error = response;
            continue;
        }
        const responseJson = await (response as Response).json();
        const location = formatResponse(responseJson);
        if (location) {
            return location;
        }
    }
    return error;
}

function isIGeoLocationDB(response: ApiResponse): response is IGeoLocationDB {
    return 'IPv4' in response;
}

function formatResponse(
    response: ApiResponse | undefined,
): Location | undefined {
    if (!response) {
        return undefined;
    }
    return {
        country: isIGeoLocationDB(response)
            ? response.country_code
            : response.country,
        country_name: response.country_name,
        ip: isIGeoLocationDB(response) ? response.IPv4 : response.ip,
    };
}
export async function isBlockedCountry(): Promise<boolean | Error> {
    // if there are no blocked countries, then there is no need to check
    if (!BLOCKED_COUNTRIES) return false;

    const response = await fetchLocation();
    if (response instanceof Error) {
        return response;
    }

    const {country, country_name, ip} = response;
    console.debug(`Your IP address=${ip} located in ${country_name}`);

    return BLOCKED_COUNTRIES.includes(country);
}
