import React from 'react';

import {classnames} from '../classnames';

import {PaginationInterface} from './Pagination.interface';

import './styles.scss';

const Pagination = (props: PaginationInterface) => {
    const {
        currentPage,
        maxPageLimit,
        minPageLimit,
        onNextClick,
        setCurrentPage,
        onPrevClick,
        onLastClick,
        totalPages,
        classes,
    } = props;
    const total = totalPages;

    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
        pages.push(i);
    }

    const pageNumbers = pages.map(page => {
        if (page <= maxPageLimit && page > minPageLimit) {
            return (
                <li
                    key={page}
                    id={page.toString()}
                    onClick={() => setCurrentPage(Number(page.toString()))}
                    className={classnames('page-number', {
                        active: currentPage === page,
                    })}
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
        <div className={classnames('pagination-container', classes)}>
            <ul className="page-numbers">
                <li>
                    <span
                        onClick={() =>
                            currentPage === pages[0] ? null : onPrevClick()
                        }
                        className={classnames('paginator-button', {
                            disabled: currentPage === pages[0],
                        })}
                    >
                        Prev
                    </span>
                </li>
                {pageNumbers}
                {pageIncrementEllipses}
                <li
                    onClick={() => onLastClick(total)}
                    className={classnames('page-number', {
                        hidden: currentPage === total || maxPageLimit >= total,
                    })}
                >
                    {total}
                </li>
                <li>
                    <span
                        onClick={() =>
                            currentPage === pages[pages.length - 1]
                                ? null
                                : onNextClick()
                        }
                        className={classnames('paginator-button', {
                            disabled: currentPage === pages[pages.length - 1],
                        })}
                    >
                        Next
                    </span>
                </li>
            </ul>
        </div>
    );
};

export default Pagination;
