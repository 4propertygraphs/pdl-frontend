import { useState, useEffect } from 'react';
import AgencyModal from '../components/modals/AgencyModal';
import CreateAgencyModal from '../components/modals/CreateAgencyModal'; // Import the new modal
import apiService from '../services/ApiService';
import { Agency } from '../interfaces/Models';
import { useNavigate } from 'react-router-dom';
import SearchBarModal from '../components/SearchBar'; // Import SearchBarModal

type Source = 'acquaint' | 'daft' | 'myhome';
type FilterLogic = 'AND' | 'OR' | 'NOT';

function Agencies() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]); // Add filtered agencies state
    const [searchText, setSearchText] = useState(''); // Add search text state
    const [isLoading, setIsLoading] = useState(true);
    const [modalStack, setModalStack] = useState<
        { type: 'agency' | 'agencyPipelines' | 'createAgency'; data?: any; createMode?: boolean }[]
    >([]);
    // Track if agencies need refresh after modal edit
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [sourceFilters, setSourceFilters] = useState<Source[]>([]);
    const [filterLogic, setFilterLogic] = useState<FilterLogic>('AND');
    const [propertyCounts, setPropertyCounts] = useState<{ [agencyId: number]: number }>({}); // Add property counts state
    const [agencyLoading, setAgencyLoading] = useState<{ [agencyId: number]: boolean }>({}); // Track loading per agency
    const [agencyKeyInput, setAgencyKeyInput] = useState('');
    const [agencyKeyError, setAgencyKeyError] = useState('');
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const navigate = useNavigate();

    // Get base path for static assets from env (default to empty string if not set)
    const basePath = import.meta.env.VITE_REACT_APP_FILE_LOCATION || '';

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const cachedAgencies = localStorage.getItem('agencies');
                const cachedCounts = localStorage.getItem('agencyPropertyCounts');
                if (cachedAgencies) {
                    try {
                        let parsedAgencies = JSON.parse(cachedAgencies);
                        // Ensure parsedAgencies is an array
                        let agenciesData = Array.isArray(parsedAgencies) ? parsedAgencies : [];
                        setAgencies(agenciesData);
                        setFilteredAgencies(agenciesData);
                        
                        if (cachedCounts) {
                            try {
                                let parsedCounts = JSON.parse(cachedCounts);
                                // Ensure parsedCounts is an object
                                if (parsedCounts && typeof parsedCounts === 'object' && !Array.isArray(parsedCounts)) {
                                    setPropertyCounts(parsedCounts);
                                } else {
                                    // Use total_properties from agencies as fallback
                                    const counts: { [agencyId: number]: number } = {};
                                    agenciesData.forEach((agency: Agency) => {
                                        if (typeof agency.total_properties === 'number') {
                                            counts[agency.id] = agency.total_properties;
                                        }
                                    });
                                    setPropertyCounts(counts);
                                    localStorage.setItem('agencyPropertyCounts', JSON.stringify(counts));
                                }
                            } catch (parseError) {
                                console.error('Error parsing cached counts:', parseError);
                                // Use total_properties from agencies as fallback
                                const counts: { [agencyId: number]: number } = {};
                                agenciesData.forEach((agency: Agency) => {
                                    if (typeof agency.total_properties === 'number') {
                                        counts[agency.id] = agency.total_properties;
                                    }
                                });
                                setPropertyCounts(counts);
                                localStorage.setItem('agencyPropertyCounts', JSON.stringify(counts));
                            }
                        } else {
                            // Use total_properties from agencies as fallback
                            const counts: { [agencyId: number]: number } = {};
                            agenciesData.forEach((agency: Agency) => {
                                if (typeof agency.total_properties === 'number') {
                                    counts[agency.id] = agency.total_properties;
                                }
                            });
                            setPropertyCounts(counts);
                            localStorage.setItem('agencyPropertyCounts', JSON.stringify(counts));
                        }
                        setIsLoading(false);
                    } catch (parseError) {
                        console.error('Error parsing cached agencies:', parseError);
                        // Clear invalid cache and fetch from API
                        localStorage.removeItem('agencies');
                        localStorage.removeItem('agencyPropertyCounts');
                        // Continue to fetch from API
                    }
                }
                
                // If no valid cached data or parsing failed, fetch from API
                if (!cachedAgencies || agencies.length === 0) {
                    const agenciesResponse = await apiService.getAgencies();
                    let agenciesData = agenciesResponse.data;
                    // Ensure agenciesData is an array
                    agenciesData = Array.isArray(agenciesData) ? agenciesData : [];
                    setAgencies(agenciesData);
                    setFilteredAgencies(agenciesData);
                    // Use total_properties from backend as initial propertyCounts
                    const counts: { [agencyId: number]: number } = {};
                    agenciesData.forEach((agency: Agency) => {
                        if (typeof agency.total_properties === 'number') {
                            counts[agency.id] = agency.total_properties;
                        }
                    });
                    setPropertyCounts(counts);
                    localStorage.setItem('agencies', JSON.stringify(agenciesData));
                    localStorage.setItem('agencyPropertyCounts', JSON.stringify(counts));
                }
            } catch (error) {
                console.error('Error fetching agencies:', error);
                // Set empty arrays to prevent further errors
                setAgencies([]);
                setFilteredAgencies([]);
                setPropertyCounts({});
            } finally {
                setIsLoading(false);
            }
        };

        fetchAgencies();
    }, []);

    // Helper to check if agency has a source
    const hasSource = (agency: Agency, source: Source) => {
        if (source === 'acquaint') return !!agency.acquaint_site_prefix;
        if (source === 'daft') return !!agency.daft_api_key;
        if (source === 'myhome') return !!agency.myhome_api_key;
        return false;
    };

    useEffect(() => {
        // Filter agencies based on search text and source filters
        const agenciesArray = Array.isArray(agencies) ? agencies : [];
        let filtered = agenciesArray.filter((agency) =>
            agency.name.toLowerCase().includes(searchText.toLowerCase())
        );

        if (sourceFilters.length > 0) {
            filtered = filtered.filter((agency) => {
                const matches = sourceFilters.map((src) => hasSource(agency, src));
                if (filterLogic === 'AND') {
                    return matches.every(Boolean);
                } else if (filterLogic === 'OR') {
                    return matches.some(Boolean);
                } else if (filterLogic === 'NOT') {
                    return matches.every((m) => !m);
                }
                return true;
            });
        }

        setFilteredAgencies(filtered);
    }, [searchText, agencies, sourceFilters, filterLogic, agencyKeyInput, token]);

    useEffect(() => {
        setToken(localStorage.getItem('token'));
    }, []);

    // Only allow search if logged in or agency key is provided
    const canSearch = !!token;

    // Helper to create a slug from agency name
    const slugify = (name: string) =>
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, ''); // trim hyphens

    // Handle agency key submit for non-logged-in users
    const handleAgencyKeySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const found = agencies.find(a => a.unique_key === agencyKeyInput.trim());
        if (found) {
            setAgencyKeyError('');
            navigate(`/properties/${slugify(found.name)}`, { state: { agency: found } });
        } else {
            setAgencyKeyError('No agency found with this key.');
        }
    };

    // Add state for the refresh button loading state
    const [refreshAgenciesLoading, setRefreshAgenciesLoading] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    const refreshAgencies = async () => {
        setIsLoading(true);
        try {
            const agenciesResponse = await apiService.getAgencies();
            let agenciesData = agenciesResponse.data;
            // Ensure agenciesData is an array
            agenciesData = Array.isArray(agenciesData) ? agenciesData : [];
            setAgencies(agenciesData);
            setFilteredAgencies(agenciesData); // Show agencies immediately
            localStorage.setItem('agencies', JSON.stringify(agenciesData));

            // Don't update property counts on regular refresh
            // Instead, merge new agencies with existing counts
            const existingCounts = { ...propertyCounts };
            const updatedCounts: { [agencyId: number]: number } = {};

            // For each agency, use existing count if available
            agenciesData.forEach((agency: Agency) => {
                if (existingCounts[agency.id] !== undefined) {
                    // Use existing count if we have it
                    updatedCounts[agency.id] = existingCounts[agency.id];
                } else if (typeof agency.total_properties === 'number') {
                    // Only use total_properties for new agencies we don't have counts for
                    updatedCounts[agency.id] = agency.total_properties;
                }
            });

            setPropertyCounts(updatedCounts);
            localStorage.setItem('agencyPropertyCounts', JSON.stringify(updatedCounts));
        } catch (error) {
            console.error('Error refreshing agencies:', error);
            // Set empty arrays to prevent further errors
            setAgencies([]);
            setFilteredAgencies([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Add a new function to handle the refresh agencies button click
    const handleRefreshAgencies = async () => {
        if (!window.confirm("Are you sure you want to refresh all agencies from the database?")) {
            return;
        }
        setRefreshError(null); // clear previous error
        setRefreshAgenciesLoading(true);
        try {
            await apiService.refreshAgencies();
            // After successful refresh from database, reload the agencies
            await refreshAgencies();
        } catch (error: any) {
            if (error?.response?.status === 429) {
                setRefreshError("A refresh is already running. Please wait for it to finish.");
            } else {
                setRefreshError("Failed to refresh agencies. Please try again.");
                console.error('Error refreshing agencies from database:', error);
            }
        } finally {
            setRefreshAgenciesLoading(false);
        }
    };

    const openModal = (type: 'agency' | 'agencyPipelines' | 'createAgency', data?: any, createMode = false) => {
        setModalStack((prevStack) => [...prevStack, { type, data, createMode }]);
    };

    const closeModal = (refresh = false) => {
        setModalStack((prevStack) => prevStack.slice(0, -1));
        // Only refresh if explicitly requested (e.g. after save), not on every leave
        if (refresh) {
            setTimeout(() => setShouldRefresh(true), 0);
        }
    };

    // Refresh agencies if needed after modal edit
    useEffect(() => {
        if (shouldRefresh) {
            refreshAgencies();
            setShouldRefresh(false);
        }
    }, [shouldRefresh]);

    const currentModal = modalStack[modalStack.length - 1];

    const handleAgencyClick = (agency: Agency) => {
        const slug = slugify(agency.name);
        navigate(`/properties/${slug}`, { state: { agency } }); // Use slug in URL
    };

    // UI for source filters
    const handleSourceChange = (src: Source) => {
        setSourceFilters((prev) =>
            prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
        );
    };

    const handleLogicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterLogic(e.target.value as FilterLogic);
    };

    // Compute total properties from cached propertyCounts
    const totalProperties = Object.values(propertyCounts).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);

    // Refresh property count for a single agency (use backend recount route)
    const refreshAgencyPropertyCount = async (agency: Agency) => {
        setAgencyLoading(prev => ({ ...prev, [agency.id]: true }));
        try {
            // Use backend recount route
            const res = await apiService.recountAgencyProperties(agency.id);
            // The backend always returns total_properties in the response
            const count = res.data.total_properties;
            setPropertyCounts(prev => {
                const updated = { ...prev, [agency.id]: count };
                localStorage.setItem('agencyPropertyCounts', JSON.stringify(updated));
                return updated;
            });
        } catch (err: any) {
            // If backend returns an error, set count to 0
            setPropertyCounts(prev => {
                const updated = { ...prev, [agency.id]: 0 };
                localStorage.setItem('agencyPropertyCounts', JSON.stringify(updated));
                return updated;
            });
        } finally {
            // Remove the spinny thing as soon as the request is done
            setAgencyLoading(prev => ({ ...prev, [agency.id]: false }));
        }
    };

    // Add a button to recount all agencies' properties using backend
    const [recountAllLoading, setRecountAllLoading] = useState(false);
    const [recountError, setRecountError] = useState<string | null>(null);

    const handleRecountAll = async () => {
        if (!window.confirm("Are you sure you want to recount all agencies' properties?")) {
            return;
        }
        setRecountError(null); // clear previous error
        setRecountAllLoading(true);
        try {
            await apiService.recountAllAgencyProperties();
            await refreshAgencies();
        } catch (error: any) {
            if (error?.response?.status === 429) {
                setRecountError("A recount is already running. Please wait for it to finish.");
            } else {
                setRecountError("Failed to start recount. Please try again.");
                console.error('Error recounting all properties:', error);
            }
        } finally {
            setRecountAllLoading(false);
        }
    };

    // Only define handleSearchChange if logged in
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value); // Update search text
    };

    // UI for source filters
    const filterControls = (
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded shadow-sm text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">Source:</span>
            <label className="flex items-center space-x-1">
                <input
                    type="checkbox"
                    checked={sourceFilters.includes('acquaint')}
                    onChange={() => handleSourceChange('acquaint')}
                    className="accent-purple-500"
                />
                <span>Acquaint</span>
            </label>
            <label className="flex items-center space-x-1">
                <input
                    type="checkbox"
                    checked={sourceFilters.includes('daft')}
                    onChange={() => handleSourceChange('daft')}
                    className="accent-purple-500"
                />
                <span>Daft</span>
            </label>
            <label className="flex items-center space-x-1">
                <input
                    type="checkbox"
                    checked={sourceFilters.includes('myhome')}
                    onChange={() => handleSourceChange('myhome')}
                    className="accent-purple-500"
                />
                <span>MyHome</span>
            </label>
            <select
                value={filterLogic}
                onChange={handleLogicChange}
                className="ml-2 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
            >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
            </select>

        </div>
    );

    return (
        <div className="min-h-screen ml-0 sm:ml-64 dark:bg-gray-800 flex flex-col">
            {!token ? (
                <div className="flex flex-col items-center justify-center my-6">
                    <form onSubmit={handleAgencyKeySubmit} className="flex flex-col items-center">
                        <label className="mb-2 text-gray-700 dark:text-gray-200 font-medium">
                            Enter your agency key to view your properties:
                        </label>
                        <input
                            type="text"
                            value={agencyKeyInput}
                            onChange={e => setAgencyKeyInput(e.target.value)}
                            className="border border-gray-300 dark:border-gray-700 rounded px-3 py-1 mb-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                            placeholder="Agency Key"
                        />
                        <button
                            type="submit"
                            className="px-4 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                        >
                            Go to Properties
                        </button>
                        {agencyKeyError && (
                            <span className="text-red-500 text-xs mt-2">{agencyKeyError}</span>
                        )}
                    </form>
                </div>
            ) : (
                <>
                    {/* Fix search bar at the top of the viewport */}
                    <div className="fixed top-0 left-0 sm:left-64 right-0 bg-gray-100 dark:bg-gray-800 z-30">
                        <SearchBarModal
                            searchText={searchText}
                            onSearchChange={handleSearchChange}
                            onRefresh={refreshAgencies}
                            agency={null}
                            title='Agencies'
                            placeholder='Search agencies...'
                            filters={filterControls}
                            disabled={!canSearch}
                        />
                    </div>

                    {/* Add padding to account for the fixed search bar */}
                    <div className="pt-32 sm:pt-36">
                        {/* Show total properties and recount all button */}
                        <div className="my-2 sm:my-4 mx-1 sm:mx-4 bg-white dark:bg-gray-900">
                            {canSearch ? (
                                <>
                                    <div className="flex items-center ml-2 sm:ml-4 mr-2 sm:mr-4 mt-4 sm:mt-6 pt-3 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        <span>Total properties: {totalProperties}</span>
                                        {/* Show recount error if present */}
                                        {recountError && (
                                            <span className="ml-4 text-xs text-red-500 font-normal">{recountError}</span>
                                        )}
                                        <button
                                            className="ml-4 px-2 py-1 text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
                                            onClick={handleRecountAll}
                                            disabled={recountAllLoading}
                                            title="Recount all agencies' properties"
                                        >
                                            {recountAllLoading ? (
                                                <span className="inline-block w-4 h-4 mr-1 align-middle border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                                            ) : null}
                                            Recount All
                                        </button>

                                        {/* Show refresh error if present */}
                                        {refreshError && (
                                            <span className="ml-4 text-xs text-red-500 font-normal">{refreshError}</span>
                                        )}
                                        {/* Add button for refreshing agencies from database */}
                                        <button
                                            className="ml-4 px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                                            onClick={handleRefreshAgencies}
                                            disabled={refreshAgenciesLoading}
                                            title="Refresh agencies from database"
                                        >
                                            {refreshAgenciesLoading ? (
                                                <span className="inline-block w-4 h-4 mr-1 align-middle border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                                            ) : null}
                                            Refresh Agencies
                                        </button>

                                        {/* Replace this button to use createAgency modal type */}
                                        <button
                                            className="ml-auto px-3 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                                            onClick={() => openModal('createAgency')}
                                            title="Create new agency"
                                        >
                                            <span className="inline-block mr-1">+</span> Create Agency
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <div className="p-4 text-center text-gray-600 dark:text-gray-300">Loading agencies...</div>
                                    ) : (
                                        <div className="p-2 sm:p-4">
                                            <div
                                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                            >
                                                {Array.isArray(filteredAgencies) && filteredAgencies.map((agency: Agency) => (
                                                    <div
                                                        key={agency.id}
                                                        className="bg-white dark:bg-gray-800 shadow-md rounded p-4 cursor-pointer hover:shadow-lg transition-shadow"
                                                        onClick={() => handleAgencyClick(agency)}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">{agency.name} </h2>
                                                            <button
                                                                className="text-purple-500 cursor-pointer underline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openModal('agency', agency);
                                                                }}
                                                            >
                                                                Show
                                                            </button>
                                                        </div>

                                                        {'id' in agency && (
                                                            <>
                                                                {agency.office_name && (
                                                                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                                        {agency.office_name}
                                                                    </div>
                                                                )}
                                                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                                                                    Properties: {
                                                                        propertyCounts[agency.id] !== undefined
                                                                            ? propertyCounts[agency.id]
                                                                            : <span className="italic text-gray-400">Loading...</span>
                                                                    }
                                                                    <button
                                                                        className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center"
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            refreshAgencyPropertyCount(agency);
                                                                        }}
                                                                        title="Refresh property count"
                                                                        disabled={agencyLoading[agency.id]}
                                                                    >
                                                                        {agencyLoading[agency.id] ? (
                                                                            <span className="inline-block w-4 h-4 mr-1 align-middle border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                                                                        ) : null}
                                                                        Refresh
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}

                                                        <div className="flex space-x-2 mt-2">
                                                            {agency.acquaint_site_prefix && (
                                                                <img
                                                                    src={`${basePath}/acquaint.jpg`}
                                                                    alt="Site Logo"
                                                                    className={`h-8 w-8 object-contain bg-white rounded ${agency.primary_source &&
                                                                        agency.primary_source
                                                                            .split(',')
                                                                            .map((s: string) => s.trim())
                                                                            .includes('acquaint')
                                                                        ? "border-2 border-purple-500"
                                                                        : ""
                                                                        }`}
                                                                    title={agency.primary_source &&
                                                                        agency.primary_source
                                                                            .split(',')
                                                                            .map((s: string) => s.trim())
                                                                            .includes('acquaint')
                                                                        ? "Primary Source"
                                                                        : "Acquaint"}
                                                                />
                                                            )}

                                                            {agency.daft_api_key && (
                                                                <img
                                                                    src={`${basePath}/daft.jpg`}
                                                                    alt="Daft Logo"
                                                                    className={`h-8 w-8 object-contain bg-white rounded ${agency.primary_source &&
                                                                        agency.primary_source
                                                                            .split(',')
                                                                            .map((s: string) => s.trim())
                                                                            .includes('daft')
                                                                        ? "border-2 border-purple-500"
                                                                        : ""
                                                                        }`}
                                                                    title={agency.primary_source &&
                                                                        agency.primary_source
                                                                            .split(',')
                                                                            .map((s: string) => s.trim())
                                                                            .includes('daft')
                                                                        ? "Primary Source"
                                                                        : "Daft"}
                                                                />
                                                            )}
                                                            {agency.myhome_api_key && (
                                                                <img
                                                                    src={`${basePath}/myhome.png`}
                                                                    alt="MyHome Logo"
                                                                    className={`h-8 w-8 object-contain bg-white rounded ${agency.primary_source &&
                                                                        agency.primary_source
                                                                            .split(',')
                                                                            .map((s: string) => s.trim())
                                                                            .includes('myhome')
                                                                        ? "border-2 border-purple-500"
                                                                        : ""
                                                                        }`}
                                                                    title={agency.primary_source &&
                                                                        agency.primary_source
                                                                            .split(',')
                                                                            .map((s: string) => s.trim())
                                                                            .includes('myhome')
                                                                        ? "Primary Source"
                                                                        : "MyHome"}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                                    Please enter your agency key to search for agencies.
                                </div>
                            )}

                            {/* Modals */}
                            {currentModal?.type === 'agency' && (
                                <AgencyModal
                                    show={currentModal?.type === 'agency'}
                                    agency={currentModal.data}
                                    // Only trigger refresh if true is passed (e.g. after save)
                                    onClose={(refresh = false) => closeModal(refresh)}
                                />
                            )}

                            {/* Add the new CreateAgencyModal */}
                            {currentModal?.type === 'createAgency' && (
                                <CreateAgencyModal
                                    show={currentModal?.type === 'createAgency'}
                                    onClose={(refresh = false) => closeModal(refresh)}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div >
    );
}


export default Agencies;