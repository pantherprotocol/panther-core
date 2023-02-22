export type IIpApi = {
    country: string;
    country_name: string;
    ip: string;
};
export type IGeoLocationDB = {
    country_code: string;
    country_name: string;
    IPv4: string;
};

export type ApiResponse = IIpApi | IGeoLocationDB;

export type Location = {
    country: string;
    country_name: string;
    ip: string;
};
