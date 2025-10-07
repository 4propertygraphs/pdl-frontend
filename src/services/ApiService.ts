import axios, { AxiosInstance } from 'axios';
import { Agency } from '../interfaces/Models';
import { cacheService } from './CacheService';

class ApiService {
    private directApi: AxiosInstance;

    constructor() {
        const proxyBaseUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api';
        this.directApi = axios.create({
            baseURL: proxyBaseUrl,
        });
    }

    // Helper method to get token from localStorage
    private getAuthToken(): string | null {
        return localStorage.getItem('token');
    }

    // URL utility functions
    static urls = {

        properties: () => '/api/properties',
        GetMyHome: () => '/api/myhome',
        GetAcquaint: () => '/api/acquaint',
        GetDaft: () => '/api/daft',
        field_mappings: () => '/api/field_mappings',

        agencies: () => '/api/agencies',
        agency: () => '/api/agency/',
        verifyToken: () => '/api/verify_token',
        login: () => '/api/login',
        UpdateAgency: () => '/api/agencies/',
    };



    async getProperties(key: string) {
        const response = await this.directApi.get(ApiService.urls.properties(), {
            headers: {
                'key': key
            }
        });

        const properties = response.data;

        if (!Array.isArray(properties)) {
            throw new Error('Invalid response format');
        }

        return {
            data: properties.map(prop => ({
                Id: prop.Id || prop.id,
                ParentId: prop.ParentId,
                Address: prop.Address || prop.ShortDescription || prop.CountyCityName || 'Unknown',
                Propertymarket: prop.Type || 'Residential',
                PrimaryImage: prop.PrimaryImage || '',
                Type: prop.Type || '',
                Status: prop.Status || '',
                ShortDescription: prop.ShortDescription || '',
                Price: prop.Price || '0',
                Agent: prop.Agent || 'Unknown',
                Office: prop.Office || '',
                OfficeAddress: prop.OfficeAddress || '',
                CountyCityName: prop.CountyCityName || '',
                BedRooms: parseInt(prop.BedRooms) || 0,
                BathRooms: parseInt(prop.BathRooms) || 0,
                Size: prop.FloorArea || '0',
                SizeInAcres: prop.SizeInAcres || '',
                Beds: prop.Beds || prop.BedRooms || 0,
                GPS: prop.GPS || {
                    Latitude: 0,
                    Longitude: 0,
                    Zoom: 0
                },
                Created: prop.Created || '',
                Modified: prop.Modified || '',
                Pics: prop.Pics || [],
                ListReff: prop.ListReff || prop.Id || prop.id,
                acquaintsiteprefix: prop.acquaintsiteprefix || '',
                FullAddress: prop.FullAddress || prop.Address || '',
                Description: prop.Description || '',
                Features: prop.Features || []
            }))
        };
    }

    async getAgencies() {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const cacheKey = 'agencies';
        const cached = cacheService.get<{ data: any[] }>(cacheKey);
        if (cached) return cached;

        const response = await this.directApi.get(ApiService.urls.agencies(), {
            headers: {
                'token': token
            }
        });

        const agencies = response.data;

        if (!Array.isArray(agencies)) {
            throw new Error('Invalid response format');
        }

        const result = {
            data: agencies.map(agency => ({
                id: agency.Id || agency.id,
                name: agency.Name || agency.name,
                address: agency.Address1 || '',
                address2: agency.Address2 || '',
                logo: agency.Logo,
                site_name: agency.AcquiantCustomer?.SiteName || agency.site_name,
                acquaint_site_prefix: agency.AcquiantCustomer?.SitePrefix || agency.acquaint_site_prefix,
                myhome_api_key: agency.MyhomeApi?.ApiKey || agency.myhome_api_key,
                myhome_group_id: agency.MyhomeApi?.GroupID || agency.myhome_group_id,
                daft_api_key: agency.DaftApiKey || agency.daft_api_key,
                fourpm_branch_id: agency.AcquiantCustomer?.FourPMBranchID || agency.fourpm_branch_id,
                unique_key: agency.Key || agency.unique_key,
                office_name: agency.OfficeName || agency.office_name,
                ghl_id: agency.ghl_id,
                whmcs_id: agency.whmcs_id,
                primary_source: agency.primary_source,
                total_properties: agency.total_properties || 0,
                site: agency.Site || agency.site || ''
            }))
        };

        cacheService.set(cacheKey, result, 5 * 60 * 1000);
        return result;
    }

    getAgency(key: string) {
        return this.directApi.get(ApiService.urls.agency(), {
            headers: {
                'key': key
            }
        });
    }

    verifyToken(token: string) {
        return this.directApi.get(ApiService.urls.verifyToken(), {
            headers: {
                'token': token
            }
        });
    }

    login(email: string, password: string) {
        return this.directApi.post(ApiService.urls.login(), { email, password });
    }


    getMyHome(apiKey: string, Listreff: string) {
        return this.directApi.get(`${ApiService.urls.GetMyHome()}?key=${apiKey}&id=${Listreff}`);
    }
    getDaft(apiKey: string, Listreff: string) {
        return this.directApi.get(`${ApiService.urls.GetDaft()}?key=${apiKey}&id=${Listreff}`);
    }
    GetAcquaint(apiKey: string, Listreff: string) {
        return this.directApi.get(`${ApiService.urls.GetAcquaint()}?key=${apiKey}&id=${Listreff}`);
    }
    updateAgency(id: number, data: Partial<Agency>) {
        const token = this.getAuthToken();

        return this.directApi.put(`${ApiService.urls.UpdateAgency()}${id}`, data, {
            headers: {
                'token': token
            }
        });
    }
    async GetFieldMappings() {
        const token = this.getAuthToken();
        const response = await this.directApi.get(ApiService.urls.field_mappings(), {
            headers: {
                'token': token
            }
        });
        return { data: response.data };
    }

    // Add Field Mapping CRUD
    addFieldMapping(data: any) {
        const token = this.getAuthToken();
        return this.directApi.post(ApiService.urls.field_mappings(), data, {
            headers: {
                'token': token
            }
        });
    }

    updateFieldMapping(id: number, data: any) {
        const token = this.getAuthToken();
        return this.directApi.put(`${ApiService.urls.field_mappings()}/${id}`, data, {
            headers: {
                'token': token
            }
        });
    }

    deleteFieldMapping(id: number) {
        const token = this.getAuthToken();
        return this.directApi.delete(`${ApiService.urls.field_mappings()}/${id}`, {
            headers: {
                'token': token
            }
        });
    }

    // Add recount properties endpoints
    recountAllAgencyProperties() {
        const token = this.getAuthToken();
        return this.directApi.post('/agencies/recount-properties', {}, {
            headers: {
                'token': token
            }
        });
    }

    recountAgencyProperties(id: number) {
        const token = this.getAuthToken();
        return this.directApi.post(`/agencies/${id}/recount-properties`, {}, {
            headers: {
                'token': token
            }
        });
    }

    // Add method to refresh agencies
    refreshAgencies() {
        const token = this.getAuthToken();
        return this.directApi.post('/agencies/refresh', {}, {
            headers: {
                'token': token
            }
        });
    }

    // Add this method to fetch all Daft properties
    getAllDaftProperties(apiKey: string) {
        return this.directApi.get('/api/daft/all', {
            headers: {
                'apiKey': apiKey
            }
        });
    }

    // Remove this method to fetch all Acquaint properties
    // getAllAcquaintProperties(key: string) {
    //     return this.api.get('/acquaint/all', { params: { key } });
    // }

    // Add agency creation endpoint
    createAgency(data: Partial<Agency>) {
        const token = this.getAuthToken();
        return this.directApi.post(ApiService.urls.agencies(), data, {
            headers: {
                'token': token
            }
        });
    }
}

const apiService = new ApiService();
export default apiService;
export { ApiService };