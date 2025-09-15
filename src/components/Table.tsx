import React, { ReactNode } from 'react';

interface Column<T> {
    key: keyof T;
    label: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    onRowClick?: (item: T) => void;
    selectedItems?: T[keyof T][];
    onSelectItem?: (id: T[keyof T]) => void;
    onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading?: boolean;
    renderHeader?: (col: Column<T>) => ReactNode;
    stickyHeader?: boolean; // Add this prop
    headerClassName?: string; // Add this prop for custom header styles
}

const Table = <T,>({
    columns,
    data = [],
    keyField,
    onRowClick,
    selectedItems = [],
    onSelectItem,
    onSelectAll,
    isLoading = false,
    renderHeader,
    stickyHeader = false,
    headerClassName = ''
}: TableProps<T>) => {
    return (
        <div className="w-full ">
            <div className="w-full min-w-[600px] sm:min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className={`${stickyHeader ? headerClassName : ''} bg-white dark:bg-gray-900 sticky top-0 border-b-2 border-purple-300 dark:border-gray-600`}>
                        <tr>
                            {onSelectAll && (
                                <th className="py-3 sm:py-4 px-2 sm:px-4 text-left font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100">
                                    <input
                                        id="checkbox_all"
                                        className="w-4 h-4"
                                        type="checkbox"
                                        onChange={onSelectAll}
                                        checked={selectedItems.length === data.length}
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className="px-6 py-3 pt-5 bg-white dark:bg-gray-900 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                    {renderHeader
                                        ? renderHeader(column)
                                        : column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium cursor-pointer">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-3 px-6">
                                    <div className="animate-pulse">
                                        {Array.from({ length: 10 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="h-8 sm:h-10 bg-gray-300 dark:bg-gray-700 rounded mb-2"
                                                style={{ width: '100%' }}
                                            ></div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ) : (!Array.isArray(data) || data.length === 0) ? (
                            <tr>
                                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-3 px-6 text-center">
                                    <div className="h-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        No data available.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => {
                                const rowKey = item[keyField] as T[keyof T];
                                if (!rowKey) {
                                    console.warn('Missing keyField value for item:', item);
                                    return null;
                                }
                                return (
                                    <tr
                                        key={String(rowKey)}
                                        className="border-b border-gray-200 dark:border-gray-700"
                                        onClick={() => onRowClick && onRowClick(item)}
                                    >
                                        {onSelectItem && (
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-left align-top">
                                                <input
                                                    id={`checkbox_${String(rowKey)}`}
                                                    className="w-4 h-4 mt-1"
                                                    type="checkbox"
                                                    checked={selectedItems.includes(rowKey)}
                                                    onChange={() => onSelectItem(rowKey)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                        )}

                                        {columns.map((column) => (
                                            <td key={String(column.key)} className="py-2 sm:py-3 px-2 sm:px-6 text-left whitespace-normal break-words align-top">
                                                {column.key === 'Price'
                                                    ? `€${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(item[column.key] as number)}`
                                                    : column.key === 'Modified' && item[column.key]
                                                        ? new Date(item[column.key] as string | number | Date).toLocaleString(undefined, {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: false
                                                        }).replace(',', '')
                                                        : item[column.key] as ReactNode}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;
