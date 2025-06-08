import React from 'react';
import { X, Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    partToDelete 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-red-600 flex items-center">
                        <Trash2 size={20} className="mr-2" />
                        Confirm Delete
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="mb-6">
                    <p className="text-gray-600 mb-2">
                        Are you sure you want to delete this part?
                    </p>
                    {partToDelete && (
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium text-gray-800">{partToDelete.name}</p>
                            <p className="text-sm text-gray-600">Part Number: {partToDelete.partNumber}</p>
                        </div>
                    )}
                    <p className="text-red-600 text-sm mt-2">
                        This action cannot be undone.
                    </p>
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal; 