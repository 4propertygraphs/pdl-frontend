import axios, { AxiosInstance } from 'axios';
import { Agency } from '../interfaces/Models';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        const baseURL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000/api';
        this.api = axios.create({
            baseURL,
        });
    }

    // Helper method to get token from localStorage
    private getAuthToken(): string | null {
        return localStorage.getItem('token');
    }

    // URL utility functions
    static urls = {

        properties: () => '/properties',
        GetMyHome: () => '/myhome',
        GetAcquaint: () => '/acquaint',
        GetDaft: () => '/daft', //change to /daft
        field_mappings: () => '/field_mappings',

        agencies: () => '/agencies',
        agency: () => '/agency/',
        verifyToken: () => '/verify_token',
        login: () => '/login',
        UpdateAgency: () => '/agencies/',
    };



    getProperties(key: string) {
        return this.api.get(ApiService.urls.properties(), {
            headers: {
                'key': key
            }
        });
    }

    getAgencies() {
        const token = this.getAuthToken();
        return this.api.get(ApiService.urls.agencies(), {
            headers: {
                'token': token
            }
        });
    }

    getAgency(key: string) {
        return this.api.get(ApiService.urls.agency(), {
            headers: {
                'key': key
            }
        });
    }

    verifyToken(token: string) {
        return this.api.get(ApiService.urls.verifyToken(), {
            headers: {
                'token': token
            }
        });
    }

    login(email: string, password: string) {
        // Use root URL for login endpoint by removing /api from baseURL
        const baseURL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000/api';
        const rootURL = baseURL.replace('/api', '');
        return axios.post(rootURL + ApiService.urls.login(), { email, password });
    }


    getMyHome(apiKey: string, Listreff: string) {
        return this.api.get(ApiService.urls.GetMyHome() + `?key=${apiKey}&id=${Listreff}`);

    }
    getDaft(apiKey: string, Listreff: string) {
        return this.api.get(ApiService.urls.GetDaft() + `?key=${apiKey}&id=${Listreff}`);

    }
    GetAcquaint(apiKey: string, Listreff: string) {
        return this.api.get(ApiService.urls.GetAcquaint() + `?key=${apiKey}&id=${Listreff}`);
    }
    updateAgency(id: number, data: Partial<Agency>) {
        const token = this.getAuthToken();

        return this.api.put(ApiService.urls.UpdateAgency() + id, data, {
            headers: {
                'token': token
            }
        });
    }
    GetFieldMappings() {
        const token = this.getAuthToken();
        return this.api.get(ApiService.urls.field_mappings(), {
            headers: {
                'token': token
            }
        });
    }

    // Add Field Mapping CRUD
    addFieldMapping(data: any) {
        const token = this.getAuthToken();
        return this.api.post(ApiService.urls.field_mappings(), data, {
            headers: {
                'token': token
            }
        });
    }

    updateFieldMapping(id: number, data: any) {
        const token = this.getAuthToken();
        return this.api.put(`${ApiService.urls.field_mappings()}/${id}`, data, {
            headers: {
                'token': token
            }
        });
    }

    deleteFieldMapping(id: number) {
        const token = this.getAuthToken();
        return this.api.delete(`${ApiService.urls.field_mappings()}/${id}`, {
            headers: {
                'token': token
            }
        });
    }

    // Add recount properties endpoints
    recountAllAgencyProperties() {
        const token = this.getAuthToken();
        return this.api.post('/agencies/recount-properties', {}, {
            headers: {
                'token': token
            }
        });
    }

    recountAgencyProperties(id: number) {
        const token = this.getAuthToken();
        return this.api.post(`/agencies/${id}/recount-properties`, {}, {
            headers: {
                'token': token
            }
        });
    }

    // Add method to refresh agencies
    refreshAgencies() {
        const token = this.getAuthToken();
        return this.api.post('/agencies/refresh', {}, {
            headers: {
                'token': token
            }
        });
    }

    // Add this method to fetch all Daft properties
    getAllDaftProperties(apiKey: string) {
        return this.api.get('/daft/all', { params: { apiKey } });
    }

    // Remove this method to fetch all Acquaint properties
    // getAllAcquaintProperties(key: string) {
    //     return this.api.get('/acquaint/all', { params: { key } });
    // }

    // Add agency creation endpoint
    createAgency(data: Partial<Agency>) {
        const token = this.getAuthToken();
        return this.api.post(ApiService.urls.agencies(), data, {
            headers: {
                'token': token
            }
        });
    }
}

const apiService = new ApiService();
export default apiService;
export { ApiService };