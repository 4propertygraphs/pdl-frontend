export interface Agency {

    address: string;
    office_name: string;
    daft_api_key: string | null;
    fourpm_branch_id: number;
    id: number;
    unique_key: string;
    logo: string | null;
    myhome_api_key: string | null;
    myhome_group_id: string | null;
    name: string;
    site_name: string;
    acquaint_site_prefix: string;
    ghl_id: string | null;
    whmcs_id: string | null;
    primary_source: string | null;
    total_properties: number;
    site: string;

}
export interface DataService {
    id: number;
    name: string;
    connectorConfigFields: string[];
    description: string;
    type: 'IN' | 'OUT';
    disabled: boolean; // Added disabled property
}

export interface DataPipeline {
    id: number;
    name: string;
    description: string;
    pipelineURL: string;
    disabled: boolean; // Added disabled property
}
export interface Property {
    ParentId: string;
    PrimaryImage: string;
    Type: string;
    Status: string;
    ShortDescription: string;
    Price: string;
    Agent: string;
    Office: string;
    OfficeAddress: string;
    CountyCityName: string;
    BathRooms: number;
    GPS: {
        Latitude: number;
        Longitude: number;
        Zoom: number;
    };
    Created: string;
    Modified: string;
    // Add other fields as needed
}