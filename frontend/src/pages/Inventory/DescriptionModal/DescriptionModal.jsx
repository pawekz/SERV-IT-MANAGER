import React from 'react';
import { X } from 'lucide-react';

const DescriptionModal = ({
                              isOpen,
                              onClose,
                              title,
                              content
                          }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 pr-4">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="text-gray-600 overflow-y-auto flex-grow" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                    <p className="whitespace-pre-wrap break-words">{content}</p>
                </div>
                <div className="mt-6 flex justify-end pt-2 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptionModal;