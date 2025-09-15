import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import apiService from '../../services/ApiService';

interface PropertyDetailsModalProps {
    show: boolean;
    property: any | null;
    onClose: () => void;
    onLogDetailsClick: (logId: string) => void;
    isLogModalOpen: boolean;
    selectedLog: string | null;
    closeLogModal: () => void;
    apiKey: string | null; // MyHome API key
    acquiantKey: string | null; // AcquiantCustomer key
    daft_api_key: string | null; // Daft API key
    primarySource?: string | null;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
    show,
    property,
    onClose,
    apiKey,
    acquiantKey,
    daft_api_key,
    primarySource,
}) => {
    const [additionalInfo, setAdditionalInfo] = useState<any | null>('Loading...');
    const [acquaintInfo, setAcquaintInfo] = useState<any | null>('Loading...');
    const [daftInfo, setDaftInfo] = useState<any | null>('Loading...');
    const [fieldMappings, setFieldMappings] = useState<any[]>([]);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [showSourceModal, setShowSourceModal] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                if (property?.ListReff) {
                    if (apiKey) {
                        try {
                            let listReff = property.ListReff;
                            const prefix = property.acquaintsiteprefix;

                            if (listReff.includes(prefix)) {
                                listReff = listReff.replace(prefix, '');
                            } else {
                                listReff = listReff.replace(/[A-Za-z]/g, '');
                            }

                            property.ListReff = listReff;

                            const myhome = await apiService.getMyHome(apiKey, property.ListReff);
                            setAdditionalInfo(myhome.data.Property);

                        } catch (error: any) {
                            if (error.response?.data?.message) {
                                setAdditionalInfo({ message: error.response.data.message });
                            } else {
                                setAdditionalInfo({ message: 'Failed to fetch MyHome data.' });
                            }
                        }
                    } else {
                        setAdditionalInfo({ message: 'MyHome API key is missing.' });
                    }

                    if (daft_api_key) {
                        try {
                            const daft = await apiService.getDaft(daft_api_key, property.ListReff);
                            setDaftInfo(daft.data);
                            console.log('Daft data:', daft.data);
                        } catch (error: any) {
                            if (error.response?.data?.message) {
                                setDaftInfo({ message: error.response.data.message });
                            } else {
                                setDaftInfo({ message: 'Failed to fetch Daft data.' });
                            }
                        }
                    } else {
                        setDaftInfo({ message: 'Daft API key is missing.' });
                    }

                    if (acquiantKey) {
                        try {
                            const acquaint = await apiService.GetAcquaint(acquiantKey, property.ListReff);
                            setAcquaintInfo(acquaint.data);
                        } catch (error: any) {
                            if (error.response?.data?.error) {
                                setAcquaintInfo({ message: error.response.data.error });
                            } else {
                                setAcquaintInfo({ message: error.response.data.message });
                            }
                        }
                    } else {
                        setAcquaintInfo({ message: 'Acquaint API key is missing.' });
                    }
                }
            } catch (error) {
                console.error('Error fetching property info:', error);
            }
        };

        fetchData();
    }, [property, apiKey, acquiantKey]);

    useEffect(() => {
        const fetchFieldMappings = async () => {
            try {
                const response = await apiService.GetFieldMappings();
                setFieldMappings(response.data);
            } catch (error) {
                console.error('Error fetching field mappings:', error);
            }
        };

        fetchFieldMappings();
    }, []);



    if (!property) return null;

    const CollapsibleText: React.FC<{ text: string }> = ({ text }) => {
        const [isCollapsed, setIsCollapsed] = useState(true);
        const maxLength = 100;

        if (text.length <= maxLength) return <span className="break-words">{text}</span>;

        return (
            <span className="break-words">
                {isCollapsed ? `${text.slice(0, maxLength)}...` : text}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-blue-500 ml-2 underline"
                >
                    {isCollapsed ? 'Show more' : 'Show less'}
                </button>
            </span>
        );
    };

    function getNested(obj: any, path: string): any {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    const renderData = (data: any, compareTo?: any) => {

        if (typeof data === 'string') {
            return <CollapsibleText text={data} />;
        } else if (typeof data === 'object' && data !== null) {
            return (
                <table className="w-full text-left text-md dark:text-gray-300">
                    <tbody>
                        {Object.keys(data).map(key => {
                            const value = data[key];
                            const compareValue = compareTo?.[key];

                            const isDifferent =
                                typeof value === 'string' &&
                                typeof compareValue === 'string' &&
                                value.trim() !== compareValue.trim();

                            return (
                                <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="font-medium px-2 py-1 break-words">{key}</th>
                                    <td
                                        className={`font-normal px-2 py-1 break-words ${isDifferent ? 'text-red-500 font-semibold' : ''
                                            }`}
                                    >
                                        {typeof value === 'object'
                                            ? renderData(value, compareValue)
                                            : value?.toString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );

        } else {
            return <span>{data}</span>;
        }
    };

    // Helper to compare values (ignore type, compare string representations)
    function areValuesEqual(a: any, b: any, fieldName?: string): boolean {
        if (a === undefined || a === null || b === undefined || b === null) return false;
        // For Pictures, compare by count
        if (fieldName === 'Pictures') {
            const countA = Array.isArray(a) ? a.length : (a && typeof a === 'object' ? Object.keys(a).length : 0);
            const countB = Array.isArray(b) ? b.length : (b && typeof b === 'object' ? Object.keys(b).length : 0);
            return countA === countB;
        }
        // For Description or large text fields, compare only the first sentence
        if (fieldName && typeof a === 'string' && typeof b === 'string') {
            const lowerField = fieldName.toLowerCase();
            if (lowerField.includes('description') || lowerField.includes('content') || lowerField.includes('details')) {
                const firstSentence = (txt: string) => {
                    const match = txt.match(/.*?[.!?](\s|$)/);
                    return match ? match[0].trim() : txt.trim();
                };
                return firstSentence(a) === firstSentence(b);
            }
        }
        return String(a).trim() === String(b).trim();
    }

    // Helper to check if a source is "active" (has API key and no error)
    function isSourceActive(srcKey: string): boolean {
        if (srcKey === 'propertydrive') return true;
        if (srcKey === 'myhome') return !!apiKey && !additionalInfo?.message;
        if (srcKey === 'acquaint_crm') return !!acquiantKey && !acquaintInfo?.message;
        if (srcKey === 'daft') return !!daft_api_key && !daftInfo?.message;
        return false;
    }

    const renderCell = (value: any, fieldName?: string, sourceKey?: string) => {
        // Special handling for coordinates (Latitude/Longitude)
        if ((fieldName === 'Latitude' || fieldName === 'Longitude') && value) {
            // Find the paired coordinate
            let latitude = value;
            let longitude = null;

            if (fieldName === 'Longitude') {
                latitude = null;
                longitude = value;

                // Try to get latitude from the same source
                const latMapping = fieldMappings.find(m => m.field_name === 'Latitude');
                if (latMapping && sourceKey) {
                    let dataObj: any;
                    if (sourceKey === 'propertydrive') dataObj = property;
                    else if (sourceKey === 'myhome') dataObj = additionalInfo;
                    else if (sourceKey === 'acquaint_crm') dataObj = acquaintInfo;
                    else if (sourceKey === 'daft') dataObj = daftInfo;

                    latitude = getNested(dataObj, latMapping[sourceKey]);
                }
            } else if (fieldName === 'Latitude') {
                longitude = null;

                // Try to get longitude from the same source
                const longMapping = fieldMappings.find(m => m.field_name === 'Longitude');
                if (longMapping && sourceKey) {
                    let dataObj: any;
                    if (sourceKey === 'propertydrive') dataObj = property;
                    else if (sourceKey === 'myhome') dataObj = additionalInfo;
                    else if (sourceKey === 'acquaint_crm') dataObj = acquaintInfo;
                    else if (sourceKey === 'daft') dataObj = daftInfo;

                    longitude = getNested(dataObj, longMapping[sourceKey]);
                }
            }

            // Check if we have both coordinates
            if (latitude && longitude) {
                const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                return (
                    <div>
                        <span>{value}</span>
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-800 underline"
                            title="Open in Google Maps"
                        >
                            View on Map
                        </a>
                    </div>
                );
            }
        }

        // Use getNested + mapping to extract images for the correct source
        if (fieldName === 'Pictures' && fieldMappings.length && sourceKey) {
            const mapping = fieldMappings.find(m => m.field_name === 'Pictures');
            if (mapping && mapping[sourceKey]) {
                // Pick the correct data object for the source
                let dataObj: any;
                if (sourceKey === 'propertydrive') dataObj = property;
                else if (sourceKey === 'myhome') dataObj = additionalInfo;
                else if (sourceKey === 'acquaint_crm') dataObj = acquaintInfo;
                else if (sourceKey === 'daft') dataObj = daftInfo;

                // Defensive: check for nested keys (e.g. "images" vs "Images")
                let mappingKey = mapping[sourceKey];
                let pics = getNested(dataObj, mappingKey);

                // If not found, try lowercase/uppercase variants
                if (!pics && dataObj) {
                    const keys = Object.keys(dataObj);
                    const foundKey = keys.find(
                        k => k.toLowerCase() === mappingKey.toLowerCase()
                    );
                    if (foundKey) {
                        pics = dataObj[foundKey];
                    }
                }

                // Daft-style: array of image objects with mediumUrl/smallUrl/largeUrl (mapping key: images)
                if (Array.isArray(pics)) {
                    const urls = pics
                        .map((p: any) => {
                            if (typeof p === 'string') return p;
                            if (typeof p === 'object') {
                                return (
                                    p.medium_url || p.small_url || p.large_url ||
                                    p._ || p.url || p.Url || p.URL || p.image || p.Image || null
                                );
                            }
                            return null;
                        })
                        .filter((url) => typeof url === 'string' && url.startsWith('http'));
                    if (urls.length > 0) {
                        return (
                            <div className="flex flex-wrap gap-2">
                                {urls.map((url: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Property image ${idx + 1}`}
                                        className="h-16 w-24 object-cover rounded border border-gray-200 dark:border-gray-700"
                                        loading="lazy"
                                    />
                                ))}
                            </div>
                        );
                    }
                }
                // Acquaint-style: object with picture1, picture2, etc.
                if (pics && typeof pics === 'object' && !Array.isArray(pics)) {
                    const urls = Object.values(pics)
                        .map((val: any) => {
                            if (typeof val === 'string') return val;
                            if (typeof val === 'object') return val._ || null;
                            return null;
                        })
                        .filter((url) => typeof url === 'string' && url.startsWith('http'));
                    if (urls.length > 0) {
                        return (
                            <div className="flex flex-wrap gap-2">
                                {urls.map((url: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Property image ${idx + 1}`}
                                        className="h-16 w-24 object-cover rounded border border-gray-200 dark:border-gray-700"
                                        loading="lazy"
                                    />
                                ))}
                            </div>
                        );
                    }
                }
                // If we get here, show debug info for troubleshooting
                // return <span style={{ color: 'red' }}>No images found for {sourceKey} (mapping: {mappingKey})<br />Keys: {JSON.stringify(Object.keys(dataObj || {}))}</span>;
            }
        }
        if (typeof value === 'string') {
            return <CollapsibleText text={value} />;
        }
        return value?.toString() || 'N/A';
    };

    // Define a helper function to create a Google Maps link from coordinates


    const renderFieldComparison = () => {
        if (!fieldMappings.length) return <p className='dark:text-gray-300'>Loading field mappings...</p>;

        let sourceMap = [
            { title: 'FindAHome', key: 'propertydrive', data: property, primaryKey: null },
            { title: 'MyHome', key: 'myhome', data: additionalInfo, primaryKey: 'myhome' },
            { title: 'Acquaint', key: 'acquaint_crm', data: acquaintInfo, primaryKey: 'acquaint' },
            { title: 'Daft', key: 'daft', data: daftInfo, primaryKey: 'daft' },
        ];

        // Find the mapping for Last Modified and Created
        const lastModifiedMapping = fieldMappings.find(m => m.field_name === 'Last Modified');
        const createdMapping = fieldMappings.find(m => m.field_name === 'Created');

        // Helper to get last modified value for each source
        const getLastModified = (srcKey: string) => {
            if (!lastModifiedMapping) return null;
            let dataObj: any;
            if (srcKey === 'propertydrive') dataObj = property;
            else if (srcKey === 'myhome') dataObj = additionalInfo;
            else if (srcKey === 'acquaint_crm') dataObj = acquaintInfo;
            else if (srcKey === 'daft') dataObj = daftInfo;
            else return null;
            const value = getNested(dataObj, lastModifiedMapping[srcKey]);
            if (!value) return null;
            // Try to format as date if possible
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString();
            }
            return value.toString();
        };

        // Helper to get created value for each source
        const getCreated = (srcKey: string) => {
            if (!createdMapping) return null;
            let dataObj: any;
            if (srcKey === 'propertydrive') dataObj = property;
            else if (srcKey === 'myhome') dataObj = additionalInfo;
            else if (srcKey === 'acquaint_crm') dataObj = acquaintInfo;
            else if (srcKey === 'daft') dataObj = daftInfo;
            else return null;
            const value = getNested(dataObj, createdMapping[srcKey]);
            if (!value) return null;
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString();
            }
            return value.toString();
        };

        // Handle agency.primary_source as a comma-separated list, pick the first one that got a response
        let agencyPrimarySources: string[] = [];
        if (property?.agency?.primary_source) {
            agencyPrimarySources = property.agency.primary_source
                .split(',')
                .map((s: string) => s.trim().toLowerCase())
                .filter(Boolean);
        }

        // --- Reorder sourceMap so the primary source is first ---
        let primaryKey: string | null = null;
        if (agencyPrimarySources.length > 0) {
            // Use the first available primary source from agency
            primaryKey = agencyPrimarySources[0];
        } else if (primarySource) {
            // Use the first from props.primarySource
            const lower = primarySource
                ? primarySource.split(',').map((s: string) => s.trim().toLowerCase())
                : [];
            if (lower.length > 0) primaryKey = lower[0];
        }
        if (primaryKey) {
            // Find the index in sourceMap
            const idx = sourceMap.findIndex(
                src => src.primaryKey && src.primaryKey.toLowerCase() === primaryKey
            );
            if (idx > 0) {
                // Move the primary source to the front
                const [primarySrc] = sourceMap.splice(idx, 1);
                sourceMap.unshift(primarySrc);
            }
        }
        // --- end reorder ---

        return (
            <>
                <table className="w-full text-left text-md dark:text-gray-300 table-auto">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="font-medium px-4 py-2 align-top">Field Name</th>
                            {sourceMap.map((src) => {
                                // Determine if this is the primary source
                                const isPrimary =
                                    primarySource &&
                                    src.primaryKey &&
                                    primarySource
                                        .split(',')
                                        .map((s: string) => s.trim().toLowerCase())
                                        .includes(src.primaryKey.toLowerCase());
                                return (
                                    <th
                                        key={src.title}
                                        className={`font-medium px-4 py-2 align-top cursor-pointer transition-colors
                                            text-blue-600 hover:text-blue-800 ${isPrimary ? 'font-bold' : ''}
                                        `}
                                        title={
                                            isPrimary
                                                ? `Primary Source (${src.title})`
                                                : `Click to view all data from ${src.title}`
                                        }
                                        onClick={() => {
                                            setSelectedSource(src.title);
                                            setShowSourceModal(true);
                                        }}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="flex items-center">
                                                <span className="underline">{src.title}</span>
                                                {isPrimary && (
                                                    <span
                                                        className="ml-2"
                                                        title="Primary Source"
                                                        aria-label="Primary Source"
                                                    >
                                                        <span className="text-yellow-500 no-underline">★</span>
                                                    </span>
                                                )}
                                            </span>
                                            {/* Last Modified and Created date under the source name */}
                                            <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                                                {getLastModified(src.key)
                                                    ? `Last Modified: ${getLastModified(src.key)}`
                                                    : <span className="italic text-gray-400">No date</span>
                                                }
                                            </span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal">
                                                {getCreated(src.key)
                                                    ? `Created: ${getCreated(src.key)}`
                                                    : <span className="italic text-gray-400">No date</span>
                                                }
                                            </span>
                                        </div>
                                        {src.data && src.data.message ? (
                                            <span className="ml-1 text-xs text-red-500">{`(${src.data.message})`}</span>
                                        ) : null}
                                        {!src.data && <span className="ml-1 text-xs text-gray-400">{`(No data)`}</span>}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {fieldMappings.map((mapping) => {
                            // Only treat as date for Created or Last Modified (for display only)
                            const isDateField =
                                mapping.field_name === 'Created' || mapping.field_name === 'Last Modified';

                            // Gather values for all sources for this field, but only for active sources
                            const values = sourceMap.map(src =>
                                isSourceActive(src.key) ? getNested(src.data, mapping[src.key]) : undefined
                            );

                            // Only consider sources that are active and have a value for this field
                            const present = values.map((v, idx) => ({ value: v, idx }))
                                .filter(v => v.value !== undefined && v.value !== null && v.value !== '');

                            if (present.length === 0) return null;

                            // For non-date fields, check if all present values are equal
                            let allEqual = true;
                            if (!isDateField && present.length > 1) {
                                for (let i = 0; i < present.length; i++) {
                                    for (let j = i + 1; j < present.length; j++) {
                                        if (!areValuesEqual(present[i].value, present[j].value, mapping.field_name)) {
                                            allEqual = false;
                                            break;
                                        }
                                    }
                                    if (!allEqual) break;
                                }
                            }

                            // Find the primary index using agency.primary_source(s) that got a response
                            let primaryIdx = present[0].idx;
                            if (agencyPrimarySources.length > 0) {
                                for (const srcKey of agencyPrimarySources) {
                                    const found = sourceMap.findIndex(
                                        src => src.primaryKey && src.primaryKey.toLowerCase() === srcKey && isSourceActive(src.key)
                                    );
                                    if (found !== -1 && values[found] !== undefined && values[found] !== null && values[found] !== '') {
                                        primaryIdx = found;
                                        break;
                                    }
                                }
                            } else if (primarySource) {
                                const lower = primarySource
                                    ? primarySource.split(',').map((s: string) => s.trim().toLowerCase())
                                    : [];
                                const found = sourceMap.findIndex(
                                    src => src.primaryKey && lower.includes(src.primaryKey.toLowerCase())
                                );
                                if (found !== -1) primaryIdx = found;
                            }
                            const primaryValue = values[primaryIdx];

                            return (
                                <tr key={mapping.id} className="border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
                                    <td className="px-4 py-2 dark:text-gray-300">{mapping.field_name}</td>
                                    {sourceMap.map((src, idx) => {
                                        // Only show cell if source is active
                                        if (!isSourceActive(src.key)) {
                                            return <td key={src.key} className="px-4 py-2 dark:text-gray-300 text-gray-400 italic">N/A</td>;
                                        }
                                        const value = values[idx];
                                        if (value === undefined || value === null || value === '') {
                                            return <td key={src.key} className="px-4 py-2 dark:text-gray-300 text-gray-400 italic">N/A</td>;
                                        }
                                        // Primary source: default color (no highlight)
                                        let isPrimary = idx === primaryIdx;

                                        let isUnique = false;
                                        let isOrange = false;
                                        if (!isPrimary && !isDateField && !allEqual) {
                                            // Count how many present values match this value
                                            const matchCount = present.filter(
                                                (other) => areValuesEqual(value, other.value, mapping.field_name)
                                            ).length;
                                            // If only this cell has this value, it's unique (red)
                                            isUnique = matchCount === 1;
                                            // If value is different from primary, but not unique, it's orange
                                            // If it matches the primary, default color (no highlight)
                                            const matchesPrimary = areValuesEqual(value, primaryValue, mapping.field_name);
                                            const matchesOthers = present.filter(
                                                (other) => other.idx !== primaryIdx && areValuesEqual(value, other.value, mapping.field_name)
                                            ).length > 0;
                                            isOrange = !isPrimary && !isUnique && !matchesPrimary && matchesOthers;
                                            // If it matches only the primary, no color (leave cellClass default)
                                            if (!isPrimary && !isUnique && !isOrange && !matchesOthers && matchesPrimary) {
                                                // no color
                                            }
                                        }
                                        let cellClass = "px-4 py-2 dark:text-gray-300";
                                        // No highlight for primary or if matches primary
                                        if (isUnique) cellClass += " bg-red-100 dark:bg-red-900 font-semibold";
                                        else if (isOrange) cellClass += " bg-orange-100 dark:bg-orange-900 font-semibold";
                                        return (
                                            <td key={src.key} className={cellClass}>
                                                {renderCell(value, mapping.field_name, src.key)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </>
        );
    };



    return (
        <Modal show={show} onClose={onClose} title={property.Address}>
            <div className="max-h-[80vh] overflow-hidden">
                {/* Field Mapping Table at the top */}
                <div className="mb-6">
                    <div className="overflow-y-auto max-h-[80vh] border border-gray-200 dark:border-gray-700 rounded p-4">
                        {renderFieldComparison()}
                    </div>
                </div>

                {/* Source modal */}
                <Modal
                    show={showSourceModal}
                    onClose={() => setShowSourceModal(false)}
                    title={selectedSource || ''}
                >
                    <div className="w-full max-h-[70vh] overflow-y-auto border-2 border-blue-400 rounded-lg p-2 bg-blue-50 dark:bg-gray-800">
                        {(() => {
                            const infoSections = [
                                { title: 'FindAHome', data: property },
                                { title: 'MyHome', data: additionalInfo },
                                { title: 'Acquaint', data: acquaintInfo },
                                { title: 'Daft', data: daftInfo },
                            ];
                            const selected = infoSections.find(s => s.title === selectedSource);
                            if (!selectedSource || !selected) return null;
                            return (
                                <div className="w-full">
                                    {selected.data && selected.data.message ? (
                                        <p className="dark:text-gray-300">{selected.data.message}</p>
                                    ) : (
                                        renderData(selected.data)
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </Modal>
            </div>
        </Modal>
    );
};

export default PropertyDetailsModal;