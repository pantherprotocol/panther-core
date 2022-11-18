export const isObject = (obj: any) => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};
