import axios, {AxiosError} from 'axios';

const customAxios = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const errorHandler = (error: AxiosError) => {
    const expectedError =
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500;

    if (!expectedError) {
        return Promise.reject('An unexpected error occurred');
    }

    return Promise.reject(error);
};

customAxios.interceptors.response.use(undefined, errorHandler);

export default {
    get: customAxios.get,
    post: customAxios.post,
    put: customAxios.put,
    patch: customAxios.patch,
    delete: customAxios.delete,
};
