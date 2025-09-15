import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Agency } from '../../interfaces/Models';
import apiService from '../../services/ApiService';

interface AgencyModalProps {
    show: boolean;
    agency: Agency | null;
    onClose: (refresh?: boolean) => void;
}

const AgencyModal: React.FC<AgencyModalProps> = ({ show, agency, onClose }) => {
    const [agencyData, setAgencyData] = useState<Agency | null>(null);
    const [formData, setFormData] = useState<Partial<Agency>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [isFetchingSync, setIsFetchingSync] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (show && agency?.unique_key) {
                const response = await apiService.getAgency(agency?.unique_key);
                setAgencyData(response.data);
                setFormData(response.data); // Initialize form data

                // Fetch sync information if site is available
                if (response.data?.site) {
                    fetchLastSyncTime(response.data.site);
                }
            }
        };
        fetchData();
    }, [show, agency?.id]);

    const fetchLastSyncTime = async (site: string) => {
        try {
            setIsFetchingSync(true);

            // Option 1: Use a CORS proxy (temporary development solution)
            // Replace with your preferred CORS proxy service
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = `https://${site}/wp-content/plugins/wp-property-drive/includes/cli.php`;

            // Use the proxy URL to make the request
            const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`);

            // Alternative comment-out code for backend proxy solution:
            // const response = await apiService.getWpSyncStatus(site);

            if (response.ok) {
                const data = await response.json();
                if (data && data.wppd_last_sync) {
                    setLastSyncTime(data.wppd_last_sync);
                } else {
                    setLastSyncTime('No sync data available');
                }
            } else {
                setLastSyncTime('Failed to fetch sync time');
            }
        } catch (error) {
            console.error('Error fetching sync time:', error);
            setLastSyncTime('Error fetching sync time');
        } finally {
            setIsFetchingSync(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (agency?.id) {
            await apiService.updateAgency(agency.id, formData);
            setAgencyData((prev) => ({ ...prev, ...formData } as Agency));
            setIsEditing(false);
            onClose(true); // Trigger refresh in parent
        }
    };

    if (!agencyData) return null;

    return (
        <Modal show={show} onClose={() => onClose(false)} title={`${agencyData.name}`}>
            <div className="w-full overflow-hidden max-h-[80vh] dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded p-4">
                {/* Last Sync Time Information */}
                {agencyData.site && (
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-semibold">Website: </span>
                                <a
                                    href={`https://${agencyData.site}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {agencyData.site}
                                </a>
                            </div>
                            <div>
                                <span className="font-semibold">Last Sync (Wordpress website): </span>
                                {isFetchingSync ? (
                                    <span className="text-gray-500">Loading...</span>
                                ) : (
                                    <span className={lastSyncTime?.includes('Error') ? 'text-red-500' : 'text-green-600'}>
                                        {lastSyncTime || 'Not available'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit/Save/Cancel as larger outlined purple buttons at the top right */}
                <div className="flex justify-end mb-2">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="border-2 border-purple-600 text-purple-700 px-5 py-2 text-base font-semibold hover:bg-purple-50 transition-colors"
                            style={{ borderRadius: '6px' }}
                        >
                            Edit
                        </button>
                    ) : (
                        <div className="space-x-3">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="border-2 border-purple-600 text-purple-700 px-5 py-2 text-base font-semibold hover:bg-purple-50 transition-colors"
                                style={{ borderRadius: '6px' }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="border-2 border-purple-600 text-purple-700 px-5 py-2 text-base font-semibold hover:bg-purple-50 transition-colors"
                                style={{ borderRadius: '6px' }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
                <div className="overflow-y-auto max-h-[70vh]">
                    <form className="w-full">
                        {/* Separate table for API keys */}
                        <div className="mt-4">
                            <table className="w-full text-left text-sm border border-gray-300 dark:border-gray-700 rounded">
                                <tbody>
                                    {/* Show primary_source as a separate highlighted row */}

                                    {Object.entries(agencyData)
                                        .filter(([key]) =>
                                            ['primary_source', 'acquaint_site_prefix', 'daft_api_key', 'myhome_api_key'].includes(key)
                                        )
                                        .map(([key]) => (
                                            <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="font-medium px-2 py-2 capitalize w-1/4">
                                                    {key.replace(/([A-Z])/g, ' $1')}:
                                                </th>
                                                <td className="px-2 py-1 w-3/4 ">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            name={key}
                                                            value={formData[key as keyof Agency]?.toString() || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full border border-gray-300 rounded px-2 py-1 dark:bg-gray-800"
                                                        />
                                                    ) : (
                                                        <span className="block w-full">
                                                            {agencyData[key as keyof Agency]?.toString() || 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Remaining fields including address */}
                        <table className="w-full text-left text-sm mt-4">
                            <tbody>
                                {Object.entries(agencyData)
                                    .filter(
                                        ([key]) =>
                                            key !== 'id' &&

                                            !['acquaint_site_prefix', 'daft_api_key', 'myhome_api_key', 'primary_source'].includes(key)
                                    )
                                    .map(([key]) => {
                                        const isGhlId = key === 'ghl_id';
                                        const isWhmcsId = key === 'whmcs_id';
                                        const value = agencyData[key as keyof Agency]?.toString();
                                        const link =
                                            isGhlId && value
                                                ? `https://4market.4property.com/v2/location/${value}/dashboard`
                                                : isWhmcsId && value
                                                    ? `https://billing.4pm.ie/admin/clientssummary.php?userid=${value}`
                                                    : null;

                                        return (
                                            <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="font-medium px-2 py-2 capitalize w-1/4">
                                                    {link ? (
                                                        <a
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 underline"
                                                        >
                                                            {key.replace(/([A-Z])/g, ' $1')}
                                                        </a>
                                                    ) : (
                                                        key.replace(/([A-Z])/g, ' $1')
                                                    )}
                                                    :
                                                </th>
                                                <td className="px-2 py-1 w-3/4">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            name={key}
                                                            value={formData[key as keyof Agency]?.toString() || ''}
                                                            onChange={handleInputChange}
                                                            className="w-full border border-gray-300 rounded px-2 py-1 dark:bg-gray-800"
                                                        />
                                                    ) : (
                                                        <span className="block w-full">
                                                            {value || 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </form>
                    {/* Remove Save/Cancel buttons from the bottom */}
                </div>
            </div>
        </Modal>
    );
};

export default AgencyModal;