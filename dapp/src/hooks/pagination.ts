import {useState} from 'react';

import {MAX_PAGE_LIMIT, MAX_PAGE_LIMIT_MOBILE} from 'constants/pagination';

import useScreenSize from './screen';

interface PaginationHookProps {
    data: any[];
    itemsPerPage: number;
}

function usePagination(props: PaginationHookProps) {
    const {data, itemsPerPage} = props;
    const [currentPage, setCurrentPage] = useState(1);
    const {isSmall} = useScreenSize();
    const responsiveLimit = isSmall ? MAX_PAGE_LIMIT_MOBILE : MAX_PAGE_LIMIT;

    const [maxPageLimit, setMaxPageLimit] = useState(responsiveLimit);
    const [minPageLimit, setMinPageLimit] = useState(0);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const onPrevClick = () => {
        if (currentPage - 1 <= minPageLimit) {
            setMaxPageLimit(maxPageLimit - 1);
            setMinPageLimit(minPageLimit - 1);
        }
        setCurrentPage(prev => prev - 1);
    };

    const onNextClick = () => {
        if (currentPage + 1 > maxPageLimit) {
            setMaxPageLimit(maxPageLimit + 1);
            setMinPageLimit(minPageLimit + 1);
        }
        setCurrentPage(prev => prev + 1);
    };

    const onLastClick = (total: number) => {
        setCurrentPage(total);
        setMaxPageLimit(total);
        setMinPageLimit(total - responsiveLimit);
    };

    const paginatedData = () => {
        const begin = currentPage * itemsPerPage - itemsPerPage;
        const end = begin + itemsPerPage;
        return data.slice(begin, end);
    };

    return {
        onNextClick,
        onPrevClick,
        onLastClick,
        setCurrentPage,
        paginatedData,
        currentPage,
        totalPages,
        maxPageLimit,
        minPageLimit,
    };
}

export default usePagination;
