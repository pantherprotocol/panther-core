import React from 'react';

import {PaginationInterface} from './Pagination.interface';

import './styles.scss';

const Pagination = (props: PaginationInterface) => {
    const {
        currentPage,
        maxPageLimit,
        minPageLimit,
        onNextClick,
        onPageChange,
        onPrevClick,
        onLastClick,
        totalPages,
    } = props;
    const total = totalPages;

    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
        pages.push(i);
    }

    const handlePrevClick = () => {
        onPrevClick();
    };

    const handleNextClick = () => {
        onNextClick();
    };

    const handlePageClick = (e: any) => {
        onPageChange(Number(e.target.id));
    };

    const pageNumbers = pages.map(page => {
        if (page <= maxPageLimit && page > minPageLimit) {
            return (
                <li
                    key={page}
                    id={page.toString()}
                    onClick={handlePageClick}
                    className={`page-number ${
                        currentPage === page ? 'active' : ''
                    }`}
                >
                    {page}
                </li>
            );
        } else {
            return null;
        }
    });

    let pageIncrementEllipses = null;
    if (pages.length > maxPageLimit) {
        pageIncrementEllipses = <li className="ellipses">&hellip;</li>;
    }

    return (
        <div className="pagination-container">
            <ul className="page-numbers">
                <li>
                    <span
                        onClick={() =>
                            currentPage === pages[0] ? null : handlePrevClick()
                        }
                        className={`paginator-button ${
                            currentPage === pages[0] && 'disabled'
                        }`}
                    >
                        Prev
                    </span>
                </li>
                {pageNumbers}
                {pageIncrementEllipses}
                <li
                    onClick={() => onLastClick(total)}
                    className={`page-number ${
                        currentPage === total || maxPageLimit >= total
                            ? 'hidden'
                            : ''
                    }`}
                >
                    {total}
                </li>
                <li>
                    <span
                        onClick={() =>
                            currentPage === pages[pages.length - 1]
                                ? null
                                : handleNextClick()
                        }
                        className={`paginator-button ${
                            currentPage === pages[pages.length - 1] &&
                            'disabled'
                        }`}
                    >
                        Next
                    </span>
                </li>
            </ul>
        </div>
    );
};

export default Pagination;
