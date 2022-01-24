export const formatDate = (date: number | null): string | null => {
    if (!date) return null;
    const localDate = new Date(date);
    localDate.setMinutes(
        localDate.getMinutes() - localDate.getTimezoneOffset(),
    );
    return localDate.toLocaleDateString();
};
