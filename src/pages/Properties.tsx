import { useState, useEffect } from 'react';

import AgencyModal from '../components/modals/AgencyModal';
import PropertyDetailsModal from '../components/modals/PropertyModal';
import React from 'react';

import apiService from '../services/ApiService';
import Table from '../components/Table';
import SearchBarModal from '../components/SearchBar.tsx';
import { useLocation, useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';

type StatusLogic = 'AND' | 'OR' | 'NOT';
type FilterType = 'status' | 'propertymarket'; // Changed from 'type' to 'propertymarket'

// Add a Property type definition at the top level of the component
interface Property {
  Id: number;
  ParentId?: number;
  Address: string;
  Propertymarket: string;
  Status: string;
  Pics?: any; // Keep as any for flexibility with different pic formats
  [key: string]: any; // Allow for other dynamic properties
}

// Add type for property market options
interface PropertyMarketOption {
  value: string;
  display: string;
}

function Properties() {
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Agency state
  const [agency, setAgency] = useState<any>(location.state?.agency || null);
  const [agencyLoading, setAgencyLoading] = useState(false);

  // Get agency key from state or query param
  const agencyKey = agency?.unique_key || searchParams.get('key') || '';

  const [properties, setProperties] = useState<any[]>([]); // Use `any[]` to handle dynamic data
  const [originalProperties, setOriginalProperties] = useState<any[]>([]); // Add state for original properties
  const [searchText, setSearchText] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Status filters
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [statusLogic, setStatusLogic] = useState<StatusLogic>('AND');

  // Property Market filters (renamed from Type filters)
  const [propertyMarketFilters, setPropertyMarketFilters] = useState<string[]>([]);
  const [propertyMarketLogic, setPropertyMarketLogic] = useState<StatusLogic>('OR');

  // Filter popup state
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('Modified'); // Default to first column
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Utility function to format size (square meters/feet)
  const formatSize = (size: string | number | null | undefined) => {
    if (!size) return '-';

    // Check if size is already formatted
    if (typeof size === 'string' && size.includes('sq')) {
      return size; // Already formatted
    }

    // Try to format as number with sq.m. and sq.ft.
    try {
      const sizeNum = typeof size === 'string' ? parseFloat(size) : size;
      if (isNaN(sizeNum as number)) return size; // Return original if not a valid number

      const sqft = Math.round(sizeNum as number * 10.7639); // Convert sq.m to sq.ft
      return `${sizeNum} sq.m. (${sqft.toLocaleString()} sq.ft.)`;
    } catch {
      return size; // Return original on error
    }
  };

  // Utility function to format acres with 2 decimal places
  const formatAcres = (acres: string | number | null | undefined) => {
    if (!acres) return '-';

    try {
      const acresNum = typeof acres === 'string' ? parseFloat(acres) : acres;
      if (isNaN(acresNum as number)) return acres;

      // Format to 2 decimal places
      return `${(acresNum as number).toFixed(2)} acres`;
    } catch {
      return acres; // Return original on error
    }
  };

  const columns = [
    { key: 'Address', label: 'Address' },
    { key: 'Price', label: 'Price' },
    { key: "Beds", label: 'Beds' },
    { key: "Size", label: 'Size', format: formatSize },
    { key: "SizeInAcres", label: 'Acres', format: formatAcres },
    { key: 'Type', label: 'Type' },
    { key: 'Propertymarket', label: 'Market' },
    { key: 'Status', label: 'Status' },
    { key: 'Agent', label: 'Agent' },
    { key: 'Modified', label: 'Modified' },
    { key: 'Pics', label: 'Pics' },
  ];
  type ModalStackItem = {
    type: 'createOffice' | 'editOffice' | 'createAgent' | 'editAgent' | 'agency' | 'agencyPipelines';
    data?: any;
  };
  const [modalStack, setModalStack] = useState<ModalStackItem[]>([]);
  ([]);


  const closeModal = () => {
    setModalStack((prevStack) => prevStack.slice(0, -1));
  };

  const currentModal = modalStack[modalStack.length - 1];

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedLog(null);
  };

  const handleLogDetailsClick = (logId: string) => {
    setSelectedLog(logId);
    setIsLogModalOpen(true);
  };




  useEffect(() => {
    // Fetch agency info if not present in state but key is in URL
    if (!agency && agencyKey) {
      setAgencyLoading(true);
      // Fetch all agencies and find the one with the matching key
      apiService.getAgencies().then(res => {
        const found = res.data.find((a: any) => a.unique_key === agencyKey);
        setAgency(found || null);
        setAgencyLoading(false);
      }).catch(() => setAgencyLoading(false));
    }
  }, [agency, agencyKey]);


  useEffect(() => {
    if (!agencyKey) return;

    const cacheKey = `properties_${agencyKey}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;

        if (cacheAge < 5 * 60 * 1000) {
          setOriginalProperties(cachedData.data);
          setProperties(cachedData.data);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }

    setIsLoading(true);
    apiService.getProperties(agencyKey)
      .then(propertiesResponse => {
        const transformedProperties = propertiesResponse.data.map((property: Property) => {
          if (property.ParentId) {
            return {
              ...property,
              Propertymarket: 'New Home'
            };
          }
          return property;
        });

        localStorage.setItem(cacheKey, JSON.stringify({
          data: transformedProperties,
          timestamp: Date.now()
        }));

        setOriginalProperties(transformedProperties);
        setProperties(transformedProperties);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [agencyKey]);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProperties(properties.map(property => property.Id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (Id: number) => {
    setSelectedProperties(prevSelected =>
      prevSelected.includes(Id)
        ? prevSelected.filter(propertyId => propertyId !== Id)
        : [...prevSelected, Id]
    );
  };



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);

  };




  // Add available statuses here. You can expand this list later.
  const availableStatuses = [
    'Sale Agreed',
    'For Sale',
    'Sold',
    'To Let',
    'Has been Let',
    'Under Offer',
    // ...add more statuses as needed...
  ];

  // Add property market options (renamed from property types)
  const availablePropertyMarkets: PropertyMarketOption[] = [
    { value: 'Residential Sales', display: 'Residential' },
    { value: 'Land Site Sales', display: 'Land Site' },
    { value: 'Commercial Sales', display: 'Commercial' },
    { value: 'New Developments', display: 'New Developments' },
  ];

  // UI for filter popup
  const FilterPopup = ({ filterType }: { filterType: FilterType }) => {
    const isStatus = filterType === 'status';
    const filters = isStatus ? statusFilters : propertyMarketFilters;
    const setFilters = isStatus ? setStatusFilters : setPropertyMarketFilters;
    const logic = isStatus ? statusLogic : propertyMarketLogic;
    const setLogic = isStatus ? setStatusLogic : setPropertyMarketLogic;
    const options = isStatus ? availableStatuses : availablePropertyMarkets;

    // Reference for clicking outside detection
    const popupRef = React.useRef<HTMLDivElement>(null);
    const [popupPosition, setPopupPosition] = React.useState({ top: 0, left: 0 });
    const [isPositioned, setIsPositioned] = React.useState(false);

    // Calculate position relative to viewport (not page)
    React.useEffect(() => {
      // Initially hide the popup until we position it correctly
      const buttonId = isStatus ? 'status-filter-btn' : 'propertymarket-filter-btn';

      const calculatePosition = () => {
        const button = document.getElementById(buttonId);
        if (button) {
          const rect = button.getBoundingClientRect();
          const viewportWidth = window.innerWidth;

          // Use viewport-relative positioning (no scrollY adjustment)
          const top = rect.bottom;
          const left = isStatus ? rect.left : Math.max(0, Math.min(rect.right - 240, viewportWidth - 240));

          setPopupPosition({ top, left });
          setIsPositioned(true);
        } else {
          // Try again if button not found
          setTimeout(calculatePosition, 50);
        }
      };

      // Initial calculation with a short delay to ensure DOM is ready
      setTimeout(calculatePosition, 10);

      // Recalculate on window resize, but not on scroll
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [isStatus]);

    // Remove the scroll event handler - we don't want the popup to move with scroll

    // Handle clicks outside the popup
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          setActiveFilter(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleFilterChange = (value: string) => {
      setFilters((prev) =>
        prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
      );
    };

    const handleLogicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLogic(e.target.value as StatusLogic);
    };

    return (
      <>
        {/* Semi-transparent overlay to prevent interactions with elements behind */}
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'transparent' }}
          onClick={() => setActiveFilter(null)}
        />

        <div
          ref={popupRef}
          className="fixed z-[60] p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 min-w-[240px] max-w-[90vw] max-h-[80vh] overflow-auto"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            opacity: isPositioned ? 1 : 0, // Only show when positioned
            visibility: isPositioned ? 'visible' : 'hidden',
            transition: 'opacity 0.15s'
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{isStatus ? 'Status Filter' : 'Property Market Filter'}</h3>
            <button
              onClick={() => setActiveFilter(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {isStatus ? (
              // Status options (strings)
              (options as string[]).map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includes(option)}
                    onChange={() => handleFilterChange(option)}
                    className="accent-purple-500"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))
            ) : (
              // Property market options (objects with value/display)
              (options as PropertyMarketOption[]).map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includes(option.value)}
                    onChange={() => handleFilterChange(option.value)}
                    className="accent-purple-500"
                  />
                  <span className="text-sm">{option.display}</span>
                </label>
              ))
            )}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logic:
            </label>
            <select
              value={logic}
              onChange={handleLogicChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm"
            >
              <option value="AND">AND (must match all)</option>
              <option value="OR">OR (match any)</option>
              <option value="NOT">NOT (exclude all)</option>
            </select>
          </div>

          <div className="mt-3 flex justify-between">
            <button
              onClick={() => setFilters([])}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              Clear filters
            </button>
            <button
              onClick={() => setActiveFilter(null)}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Apply
            </button>
          </div>
        </div>
      </>
    );
  };

  // UI for filter buttons
  const FilterButtons = () => (
    <div className="flex flex-wrap items-center space-x-2">
      <div className="relative">
        <button
          id="status-filter-btn"
          onClick={() => setActiveFilter(activeFilter === 'status' ? null : 'status')}
          className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${statusFilters.length
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
        >
          <span>Status{statusFilters.length ? ` (${statusFilters.length})` : ''}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${activeFilter === 'status' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {activeFilter === 'status' && <FilterPopup filterType="status" />}
      </div>

      <div className="relative">
        <button
          id="propertymarket-filter-btn"
          onClick={() => setActiveFilter(activeFilter === 'propertymarket' ? null : 'propertymarket')}
          className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${propertyMarketFilters.length
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
        >
          <span>Market{propertyMarketFilters.length ? ` (${propertyMarketFilters.length})` : ''}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${activeFilter === 'propertymarket' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {activeFilter === 'propertymarket' && <FilterPopup filterType="propertymarket" />}
      </div>
    </div>
  );

  // Update filtering logic to include both status and property market filters
  useEffect(() => {
    let filtered = originalProperties;

    // Search filter
    if (searchText.trim() !== '') {
      filtered = filtered.filter((property) =>
        property.Address.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilters.length > 0) {
      filtered = filtered.filter((property) => {
        const propStatus = property.Status;
        const matches = statusFilters.map((status) => propStatus === status);
        if (statusLogic === 'AND') {
          return matches.every(Boolean);
        } else if (statusLogic === 'OR') {
          return matches.some(Boolean);
        } else if (statusLogic === 'NOT') {
          return matches.every((m) => !m);
        }
        return true;
      });
    }

    // Property Market filter (changed from Type filter)
    if (propertyMarketFilters.length > 0) {
      filtered = filtered.filter((property) => {
        const propMarket = property.Propertymarket; // Note: using the "Propertymarket" field

        // Special case for "New Developments" - also include properties with parentId
        const matches = propertyMarketFilters.map((market) => {
          if (market === 'New Developments') {
            // Match either the market is New Developments, or this is a property with parentId
            return propMarket === market || propMarket === 'New Home' || property.ParentId;
          }
          return propMarket === market;
        });

        if (propertyMarketLogic === 'AND') {
          return matches.every(Boolean);
        } else if (propertyMarketLogic === 'OR') {
          return matches.some(Boolean);
        } else if (propertyMarketLogic === 'NOT') {
          return matches.every((m) => !m);
        }
        return true;
      });
    }

    setProperties(filtered);
  }, [searchText, originalProperties, statusFilters, statusLogic, propertyMarketFilters, propertyMarketLogic]);


  const refreshProperties = async () => {
    setIsLoading(true);
    try {
      const cacheKey = `properties_${agencyKey}`;
      localStorage.removeItem(cacheKey);

      console.log('Refreshing properties with agencyKey:', agencyKey);
      const propertiesResponse = await apiService.getProperties(agencyKey || '');

      const transformedProperties = propertiesResponse.data.map((property: Property) => {
        if (property.ParentId) {
          return {
            ...property,
            Propertymarket: 'New Home'
          };
        }
        return property;
      });

      localStorage.setItem(cacheKey, JSON.stringify({
        data: transformedProperties,
        timestamp: Date.now()
      }));

      setOriginalProperties(transformedProperties);
      setProperties(transformedProperties);
    } catch (error) {
      console.error('Error refreshing properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to create a slug from agency name
  const slugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // trim hyphens

  // Copy link to clipboard (always use /properties/:slug?key=...)
  const handleCopyLink = () => {
    if (!agency) return;
    const slug = slugify(agency.name);
    const url = `${window.location.origin}${import.meta.env.VITE_REACT_APP_FILE_LOCATION || ''}/properties/${slug}?key=${encodeURIComponent(agency.unique_key)}`;
    navigator.clipboard.writeText(url);
  };

  // Sorting logic
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort properties before rendering
  const sortedProperties = React.useMemo(() => {
    if (!sortColumn) return properties;
    const sorted = [...properties].sort((a, b) => {
      // Special handling for Pics column (sort by number of images)
      if (sortColumn === 'Pics') {
        const aLen = Array.isArray(a.Pics) ? a.Pics.length : 0;
        const bLen = Array.isArray(b.Pics) ? b.Pics.length : 0;
        return sortDirection === 'asc' ? aLen - bLen : bLen - aLen;
      }

      // Get values, potentially formatting them for display
      const column = columns.find(col => col.key === sortColumn);
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Apply formatting only for comparing numeric values in formatted columns
      if (column?.format && typeof aValue === 'number' && typeof bValue === 'number') {
        // Sort by the numeric values, not the formatted strings
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return sorted;
  }, [properties, sortColumn, sortDirection, columns]);

  // Render header with chevron
  const renderHeader = (col: { key: string | number | symbol; label: string }) => {
    const colKeyStr = String(col.key);
    return (
      <span
        className="flex items-center cursor-pointer select-none"
        onClick={() => handleSort(colKeyStr)}
      >
        {col.label}
        {sortColumn === colKeyStr && (
          <svg
            className={`w-4 h-4 ml-1 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    );
  };


  const [compareLoading, setCompareLoading] = useState(false); // Daft loading

  // Add state for compare popup
  const [compareModal, setCompareModal] = useState<{
    show: boolean;
    title: string;
    missing: any[];
    source: string;
  }>({ show: false, title: '', missing: [], source: '' });


  // Add this function to compare Daft properties with current properties
  const handleCompareWithDaft = async () => {
    if (!agency?.daft_api_key) {
      // Button will not be shown if no key, so this is just a safeguard
      return;
    }
    setCompareLoading(true);
    try {
      const response = await apiService.getAllDaftProperties(agency.daft_api_key);
      // Flatten all property arrays from the daft/all response
      let daftPropertiesRaw = response.data;
      let daftProperties: any[] = [];
      if (
        daftPropertiesRaw &&
        typeof daftPropertiesRaw === 'object' &&
        (daftPropertiesRaw.sales || daftPropertiesRaw.commercial || daftPropertiesRaw.newDevelopment || daftPropertiesRaw.rental || daftPropertiesRaw.shortterm)
      ) {
        // Flatten and extract the actual property object from saleAd if present
        const extractProps = (arr: any[]) =>
          Array.isArray(arr)
            ? arr.map((item) => item?.saleAd ?? item)
            : [];
        daftProperties = [
          ...extractProps(daftPropertiesRaw.sales),
          ...extractProps(daftPropertiesRaw.commercial),
          ...extractProps(daftPropertiesRaw.newDevelopment),
          ...extractProps(daftPropertiesRaw.rental),
          ...extractProps(daftPropertiesRaw.shortterm),
        ];
      } else if (Array.isArray(daftPropertiesRaw)) {
        daftProperties = daftPropertiesRaw;
      } else if (Array.isArray(daftPropertiesRaw?.data)) {
        daftProperties = daftPropertiesRaw.data;
      }

      // Debug: log all ids from both sources
      console.log('--- Daft Compare Debug ---');
      console.log('originalProperties:', originalProperties.map((p: any) => p.Id || p.adId));
      console.log('daftProperties:', daftProperties);
      if (!Array.isArray(daftProperties) || daftProperties.length === 0) {
        // Try to show error from response if available
        let errorMsg = 'No Daft properties returned from API. Check API/Key/Backend.';
        if (response.data && typeof response.data === 'object' && response.data.error) {
          errorMsg += `\nAPI Error: ${response.data.error}`;
        }
        alert(errorMsg);
        setCompareModal({
          show: true,
          title: 'No Daft properties found',
          missing: [],
          source: 'Daft',
        });
        setCompareLoading(false);
        return;
      }
      const normalizeId = (id: any) => {
        if (id == null) return '';
        return String(id).replace(/^0+/, '');
      };
      const originalIds = originalProperties.map((p: any) => normalizeId(p.Id || p.adId));
      const daftIds = daftProperties.map((p: any) => normalizeId(p.Id || p.adId));
      console.log('normalized originalProperties:', originalIds);
      console.log('normalized daftProperties:', daftIds);
      const currentIds = new Set(originalIds);
      const missing = daftProperties.filter((p: any) => {
        const rawId = p.Id || p.adId;
        const id = normalizeId(rawId);
        const inCurrent = currentIds.has(id) || currentIds.has(Number(id).toString());
        console.log('Checking Daft id:', rawId, '->', id, 'in currentIds?', inCurrent);
        return !inCurrent;
      });
      console.log('Missing:', missing.map((p: any) => p.Id || p.adId));
      setCompareModal({
        show: true,
        title: 'Properties in Daft but not in your system',
        missing,
        source: 'Daft',
      });
    } catch (err: any) {
      // Show error message from backend if available
      let errorMsg = 'Failed to fetch Daft properties.';
      if (err?.response?.data?.error) {
        errorMsg += `\nAPI Error: ${err.response.data.error}`;
      } else if (err?.message) {
        errorMsg += `\n${err.message}`;
      }
      alert(errorMsg);
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Property count badge component
  const PropertyCountBadge = ({ count, totalCount }: { count: number; totalCount: number }) => (
    <div className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center">
      <span className="text-gray-700 dark:text-gray-200">
        {count === totalCount ? (
          `${count} properties`
        ) : (
          <>
            <span className="font-semibold">{count}</span> of <span>{totalCount}</span> properties
          </>
        )}
      </span>
    </div>
  );

  // Show loading or error if agency is not loaded
  if (agencyLoading || (!agency && agencyKey)) {
    return <div className="p-8 text-center text-gray-600 dark:text-gray-300">Loading agency...</div>;
  }
  if (!agency) {
    return <div className="p-8 text-center text-red-500">Agency not found.</div>;
  }

  return (
    <div className="min-h-screen ml-0 sm:ml-64 dark:bg-gray-800 flex flex-col overflow-auto">
      {/* Fixed search bar at the top of the viewport */}
      <div className="fixed top-0 left-0 sm:left-64 right-0 bg-gray-100 dark:bg-gray-800 z-30">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[320px] max-w-full">
            <SearchBarModal
              searchText={searchText}
              agency={agency}
              onSearchChange={handleSearchChange}
              onRefresh={refreshProperties}
              title={
                <div className="flex items-center gap-2">
                  {"Properties of " + agency?.name}
                  {/* Add Agency Modal button before Copy Link */}
                  <button
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded text-sm hover:bg-purple-200 dark:hover:bg-purple-800"
                    onClick={() => setModalStack((prev) => [...prev, { type: 'agency', data: agency }])}
                    title="View/Edit Agency"
                    type="button"
                  >
                    Agency
                  </button>
                  <button
                    className="ml-2 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded text-sm hover:bg-purple-200 dark:hover:bg-purple-800"
                    onClick={handleCopyLink}
                    title="Copy link to this agency's properties"
                    type="button"
                  >
                    Copy Link
                  </button>
                </div>
              }
              placeholder="Search properties..."
              filters={<FilterButtons />}
              countBadge={<PropertyCountBadge count={properties.length} totalCount={originalProperties.length} />}
            />
          </div>
        </div>
      </div>

      {/* Add padding to account for the fixed search bar and position content below it */}
      <div className="pt-40 sm:pt-44 flex flex-col flex-1">
        {/* Compare with Daft/Acquaint buttons */}
        <div className="w-full flex flex-wrap gap-2 justify-end px-4">
          {agency?.daft_api_key && (
            <button
              className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-sm hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-60"
              onClick={handleCompareWithDaft}
              title="Compare with Daft"
              type="button"
              disabled={compareLoading}
            >
              {compareLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 mr-1 text-green-700 dark:text-green-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Comparing...
                </span>
              ) : (
                "Compare with Daft"
              )}
            </button>
          )}
        </div>

        {/* Remove the duplicate property count badge that was here */}
        <div className="w-full flex flex-col flex-1">
          <div className="flex-1 mt-4 sm:mt-6 my-1 sm:my-2 px-0 sm:px-4 dark:bg-gray-800">
            <div className="dark:bg-gray-900">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[550px] max-w-full">
                  {/* Remove fixed height and let table take up natural height */}
                  <div className="bg-white dark:bg-gray-900">
                    <Table
                      data={sortedProperties.map((property) => {
                        // Format the property data
                        const formattedProperty = { ...property };

                        // Apply formatters for each column that has a format function
                        columns.forEach(column => {
                          if (column.format && property[column.key] != null) {
                            formattedProperty[column.key] = column.format(property[column.key]);
                          }
                        });

                        return {
                          ...formattedProperty,
                          Pics: Array.isArray(property.Pics)
                            ? property.Pics.length
                            : (property.Pics && typeof property.Pics === 'object')
                              ? Object.keys(property.Pics).length
                              : property.Pics,
                          __originalPics: property.Pics
                        };
                      })}
                      columns={columns}
                      keyField="Id"
                      onRowClick={row => {
                        const { __originalPics, ...rest } = row;
                        setSelectedProperty({ ...rest, Pics: __originalPics });
                        setShowModal(true);
                      }}
                      selectedItems={selectedProperties}
                      onSelectItem={handleSelectProperty}
                      onSelectAll={handleSelectAll}
                      isLoading={isLoading}
                      renderHeader={renderHeader}
                      stickyHeader={true}
                      headerClassName="bg-gray-100 dark:bg-gray-800 z-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Compare Modal */}
      <Modal
        show={compareModal.show}
        onClose={() => setCompareModal({ ...compareModal, show: false })}
        title={compareModal.title}
        width="max-w-3xl"
      >
        <div className="w-full">
          {compareModal.missing.length === 0 ? (
            <div className="text-green-700 dark:text-green-300 font-semibold py-4">
              All {compareModal.source} properties are present in your system.
            </div>
          ) : (
            <div>
              <div className="mb-2 text-gray-700 dark:text-gray-200">
                <b>{compareModal.missing.length}</b> properties found in {compareModal.source} but not in your system:
              </div>
              <div className="overflow-x-auto max-h-[50vh]">
                <table className="min-w-full border border-gray-300 dark:border-gray-700 text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="px-2 py-1 border-b border-gray-300 dark:border-gray-700 text-left dark:text-gray-300">Address / Title</th>
                      <th className="px-2 py-1 border-b border-gray-300 dark:border-gray-700 text-left dark:text-gray-300">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareModal.missing.map((p, idx) => (
                      <tr key={p.Id || p.adId || p.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-800 dark:text-gray-300">{p.fullAddress || p.title || '-'}</td>
                        <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-800 dark:text-gray-300">{p.Id || p.adId || p.id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modals */}
      {currentModal?.type === 'agency' && currentModal.data && (
        <AgencyModal
          show={currentModal?.type === 'agency'}
          agency={currentModal.data}
          onClose={closeModal}

        />
      )}
      {selectedProperty && (
        <PropertyDetailsModal
          show={showModal}
          property={selectedProperty} // Pass the selected property
          onClose={handleCloseModal}
          onLogDetailsClick={handleLogDetailsClick}
          isLogModalOpen={isLogModalOpen}
          selectedLog={selectedLog}
          closeLogModal={closeLogModal}
          apiKey={agency?.myhome_api_key} // Pass the MyHome API key
          acquiantKey={agency?.acquaint_site_prefix} // Pass the AcquiantCustomer key
          daft_api_key={agency?.daft_api_key} // Pass the Daft API key
          primarySource={agency?.primary_source} // <-- Add this line
        />

      )}


    </div>
  );
}

export default Properties;
