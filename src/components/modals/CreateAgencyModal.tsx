import React, { useState } from 'react';
import apiService from '../../services/ApiService';
import { Agency } from '../../interfaces/Models';

interface CreateAgencyModalProps {
    show: boolean;
    onClose: (refresh?: boolean) => void;
}

const CreateAgencyModal: React.FC<CreateAgencyModalProps> = ({ show, onClose }) => {
    // Update the types to match the Agency interface
    const [formData, setFormData] = useState<Partial<Agency>>({
        name: '',
        acquaint_site_prefix: '',
        daft_api_key: null,
        myhome_api_key: null,
        primary_source: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!show) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Handle empty strings as null for fields that expect string | null
        const finalValue = value === '' ? null : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await apiService.createAgency(formData);
            onClose(true); // Close with refresh flag
        } catch (err: any) {
            console.error('Error creating agency:', err);
            setError(err.response?.data?.message || 'Failed to create agency. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Create New Agency</h3>
                </div>

                {/* Add info message about adding values later */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                    <p>You only need to enter the Agency Name to create an agency. All other values can be added or updated later.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-5">
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                            Agency Name*
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="acquaint_site_prefix">
                            Acquaint Site Prefix
                        </label>
                        <input
                            type="text"
                            id="acquaint_site_prefix"
                            name="acquaint_site_prefix"
                            value={formData.acquaint_site_prefix}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="daft_api_key">
                            Daft API Key
                        </label>
                        <input
                            type="text"
                            id="daft_api_key"
                            name="daft_api_key"
                            value={formData.daft_api_key || ''}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="myhome_api_key">
                            MyHome API Key
                        </label>
                        <input
                            type="text"
                            id="myhome_api_key"
                            name="myhome_api_key"
                            value={formData.myhome_api_key || ''}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="primary_source">
                            Primary Source(s)
                        </label>
                        <input
                            type="text"
                            id="primary_source"
                            name="primary_source"
                            value={formData.primary_source || ''}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="acquaint, daft, myhome (comma-separated)"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Enter multiple sources as comma-separated values (e.g., "acquaint, daft")
                        </p>
                    </div>

                    <div className="flex items-center justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Agency'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAgencyModal;
