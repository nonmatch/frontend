import { useState } from 'react';

export interface Column {
    label: string;
    accessor: string;
    sortable: boolean;
}

interface TableHeadProps {
    columns: Column[];
    handleSorting: (accessor: string, sortOrder: string) => void;
}

export const TableHead: React.FC<TableHeadProps> = ({ columns, handleSorting }) => {
    const [sortField, setSortField] = useState('');
    const [order, setOrder] = useState('asc');

    const handleSortingChange = (accessor: string) => {
        const sortOrder =
            accessor === sortField && order === 'asc' ? 'desc' : 'asc';
        setSortField(accessor);
        setOrder(sortOrder);
        handleSorting(accessor, sortOrder);
    };
    return (<thead>
        <tr>
            {columns.map(({ label, accessor, sortable }) => {
                const cl = sortable
                    ? sortField === accessor && order === 'asc'
                        ? 'sortable sorted up'
                        : sortField === accessor && order === 'desc'
                            ? 'sortable sorted down'
                            : 'sortable default'
                    : '';
                return (
                    <th
                        key={accessor}
                        onClick={sortable ? () => handleSortingChange(accessor) : undefined}
                        className={cl}
                    >
                        {label}
                    </th>
                );
            })}
        </tr>
    </thead>);
}