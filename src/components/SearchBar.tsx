import React from 'react';
import { FaSearch, FaSyncAlt } from "react-icons/fa"; // Import refresh icon

interface SearchBarModalProps {
    searchText: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRefresh?: () => void; // Make onRefresh optional
    agency?: any; // Make optional
    title?: React.ReactNode; // <-- Change from string to React.ReactNode
    placeholder?: string; // Optional placeholder prop
    filters?: React.ReactNode; // Add filters prop
    countBadge?: React.ReactNode; // Add property count badge prop
    disabled?: boolean; // Add disabled prop
}

const SearchBarModal: React.FC<SearchBarModalProps> = ({
    searchText,
    onSearchChange,
    onRefresh,
    placeholder,
    title,
    filters, // Destructure filters
    countBadge, // Destructure count badge
    disabled = false, // Default to false
}) => {
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-800 pb-2">
            <div className="w-full px-2 sm:px-4 py-1 sm:py-2">
                <div className="w-full shadow-md bg-white dark:bg-gray-900 dark:text-gray-300 p-2 sm:p-4 rounded">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 w-full">
                        <h1 className="text-sm sm:text-lg font-medium truncate max-w-full">
                            {title}
                        </h1>
                        <div className="w-full sm:w-auto flex gap-x-1 sm:gap-x-2 items-center mt-1 sm:mt-0">
                            {countBadge && (
                                <div className="mr-2">{countBadge}</div>
                            )}
                            {filters && (
                                <div className="flex flex-nowrap items-center gap-x-1 sm:gap-x-2">{filters}</div>
                            )}
                            {onRefresh && (
                                <button
                                    className="p-2 text-black dark:text-gray-300 transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded ml-0 sm:ml-2 flex-shrink-0"
                                    onClick={onRefresh}
                                    title="Refresh Agencies"
                                >
                                    <FaSyncAlt className="text-base sm:text-xl" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-2 sm:px-4 py-1 sm:py-2">
                <div className="flex items-center relative w-full">
                    <input
                        id="search"
                        type="text"
                        className="shadow-md w-full bg-white dark:bg-gray-900 dark:text-gray-300 p-2 sm:p-4 pl-8 sm:pl-12 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-base"
                        placeholder={placeholder}
                        value={searchText}
                        onChange={onSearchChange}
                        disabled={disabled}
                        style={{ minWidth: 0 }}
                    />
                    <span className="absolute left-2 sm:left-4 text-gray-500 dark:text-gray-300">
                        <FaSearch />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SearchBarModal;
