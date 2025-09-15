import React from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string; // Optional width (e.g. "max-w-2xl")
}

const Modal: React.FC<ModalProps> = ({ show, onClose, title, children, width }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-500/50 z-50" onClick={onClose}>
            <div
                className={`relative bg-white dark:bg-gray-900 rounded overflow-hidden shadow-xl transform transition-all ${width || "sm:max-w-[95vw]"} sm:w-full sm:max-h-[95vh] h-[95vh] m-4 p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-2 sm:flex sm:items-center sm:justify-between border-b border-gray-200">
                    <h2 className="text-xl leading-6 font-medium text-gray-900 dark:text-gray-300">{title}</h2>
                    <button onClick={onClose} className="cursor-pointer ml-3 text-black dark:text-gray-300 p-2 text-4xl" aria-label="Close">&times;</button>
                </div>
                <hr />
                <div className="px-4 py-5 sm:p-6 h-full ">
                    <div className="mb-4 h-full flex flex-col">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
