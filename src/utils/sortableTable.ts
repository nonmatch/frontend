import { useCallback, useState } from 'react';

export const useSortableTable: (data: any[]) => any = (data: any[]) => {
    const [sortKey, setSortKey] = useState<string>();
    const [sortOrder, setSortOrder] = useState<string>();

    const sortedData = useCallback(
        () => {

            function sortData({
                tableData,
                sortKey,
                reverse,
            }: {
                tableData: any[];
                sortKey: string | undefined;
                reverse: boolean;
            }) {
                if (!sortKey) return tableData;

                console.log(sortKey, reverse)

                const sortedData = data.sort((a, b) => {
                    if (a[sortKey] === null) return 1;
                    if (b[sortKey] === null) return -1;
                    if (a[sortKey] === null && b[sortKey] === null) return 0;
                    return (
                        a[sortKey].toString().localeCompare(b[sortKey].toString(), 'en', {
                            numeric: true,
                        }) * (sortOrder === 'asc' ? 1 : -1)
                    );
                    //return a[sortKey] > b[sortKey] ? 1 : -1;
                });

                /*if (reverse) {
                    return sortedData.reverse();
                }*/

                return sortedData;
            }


            return sortData({ tableData: data, sortKey, reverse: sortOrder === 'desc' })
        },
        [data, sortKey, sortOrder]
    );


    const handleSorting = (sortField: string, sortOrder: string) => {
        setSortKey(sortField);
        setSortOrder(sortOrder);
    };

    return [sortedData, handleSorting];
};