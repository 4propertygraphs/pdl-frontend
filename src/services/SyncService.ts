import { supabase } from '../lib/supabase';

interface Agency {
  Name: string;
  OfficeName?: string;
  Address1?: string;
  Address2?: string;
  Logo?: string;
  Site?: string;
  AcquiantCustomer?: {
    SiteName?: string;
    SitePrefix?: string;
    FourPMBranchID?: number;
  };
  MyhomeApi?: {
    ApiKey?: string;
    GroupID?: number;
  };
  DaftApiKey?: string;
  Key?: string;
}

export class SyncService {
  private static syncInterval: number | null = null;
  private static lastSync: Date | null = null;
  private static isInitialized = false;
  private static isSyncing = false;

  private static removeDuplicateItems(items: Agency[], key: keyof Agency): Agency[] {
    const seen = new Set();
    const result: Agency[] = [];
    for (const item of items) {
      const keyValue = item[key];
      if (keyValue && !seen.has(keyValue)) {
        seen.add(keyValue);
        result.push(item);
      }
    }
    return result;
  }

  static async syncAgencies(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const proxyUrl = `${supabaseUrl}/functions/v1/api-proxy?path=/api/Agency/GetAgency?Key=RDlaeFVPN004a0hvJTJmWUJIQTN3TVdnJTNkJTNk0`;

      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data: Agency[] = await response.json();
      const uniqueData = this.removeDuplicateItems(data, "Name");

      let inserted = 0;
      let updated = 0;

      for (const agency of uniqueData) {
        const acquiant = agency.AcquiantCustomer || {};
        const myhome = agency.MyhomeApi || {};

        const agencyData = {
          name: agency.Name,
          office_name: agency.OfficeName || null,
          address1: agency.Address1 || '',
          address2: agency.Address2 || null,
          logo: agency.Logo || null,
          site_name: acquiant.SiteName || null,
          site_prefix: acquiant.SitePrefix || null,
          daft_api_key: agency.DaftApiKey || null,
          fourpm_branch_id: acquiant.FourPMBranchID || null,
          myhome_api_key: myhome.ApiKey || null,
          myhome_group_id: myhome.GroupID || null,
          unique_key: agency.Key || null,
        };

        const { data: existing } = await supabase
          .from('agencies')
          .select('id')
          .eq('unique_key', agencyData.unique_key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('agencies')
            .update(agencyData)
            .eq('id', existing.id);
          updated++;
        } else {
          await supabase
            .from('agencies')
            .insert(agencyData);
          inserted++;
        }
      }

      console.log(`Agencies synced: ${inserted} new, ${updated} updated`);
      this.lastSync = new Date();
    } catch (error) {
      console.error('Failed to sync agencies:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  static async syncPropertiesForAgency(agencyKey: string): Promise<void> {
    try {
      // Fetch agency to get name
      const { data: agency } = await supabase
        .from('agencies')
        .select('name, id')
        .eq('unique_key', agencyKey)
        .maybeSingle();

      if (!agency) {
        console.error('Agency not found for key:', agencyKey);
        return;
      }

      // Fetch properties directly from API
      const apiUrl = `https://api.stefanmars.nl/api/properties?Key=${agencyKey}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(`API returned ${response.status} for agency ${agency.name}`);
        return;
      }

      const properties = await response.json();

      if (!Array.isArray(properties) || properties.length === 0) {
        console.log(`No properties found for ${agency.name}`);
        return;
      }

      // Delete old properties for this agency
      await supabase
        .from('properties')
        .delete()
        .eq('agency_name', agency.name);

      let inserted = 0;
      let errors = 0;

      // Insert new properties
      for (const prop of properties) {
        const propertyData = {
          agency_agent_name: prop.Agent || 'Unknown',
          agency_name: agency.name,
          house_location: prop.CountyCityName || prop.ShortDescription || 'Unknown',
          house_price: prop.Price || '0',
          house_bedrooms: parseInt(prop.BedRooms) || 0,
          house_bathrooms: parseInt(prop.BathRooms) || 0,
          house_mt_squared: prop.FloorArea || '0',
          house_extra_info_1: prop.Type || null,
          house_extra_info_2: prop.Status || null,
          house_extra_info_3: prop.ShortDescription || null,
          house_extra_info_4: null,
          agency_image_url: null,
          images_url_house: prop.PrimaryImage || null,
        };

        const { error } = await supabase
          .from('properties')
          .insert(propertyData);

        if (error) {
          console.error('Insert error:', error);
          errors++;
        } else {
          inserted++;
        }
      }

      console.log(`Synced ${inserted} properties for ${agency.name} (${errors} errors)`);
    } catch (error) {
      console.error('Failed to sync properties:', error);
    }
  }

  static async syncAllProperties(): Promise<void> {
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select('unique_key')
      .not('unique_key', 'is', null);

    if (error) {
      console.error('Failed to fetch agencies for sync:', error);
      return;
    }

    console.log(`Syncing properties for ${agencies.length} agencies...`);

    let succeeded = 0;
    let failed = 0;

    for (const agency of agencies) {
      if (agency.unique_key) {
        try {
          console.log(`Syncing properties for agency ${succeeded + 1}/${agencies.length}...`);
          await this.syncPropertiesForAgency(agency.unique_key);
          succeeded++;
          // Add 5 second delay between requests to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`Failed to sync properties for agency ${agency.unique_key}:`, error);
          failed++;
          // Still wait a bit before next attempt even on failure
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    console.log(`Sync completed: ${succeeded} succeeded, ${failed} failed`);
  }

  static async syncAll(): Promise<void> {
    console.log('Starting full sync...');
    await this.syncAgencies();
    await this.syncAllProperties();
    console.log('Full sync completed');
  }

  static async checkAndInitialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const { count } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      console.log('Database empty, performing initial sync...');
      await this.syncAll();
    }

    this.isInitialized = true;
  }

  static startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    this.syncInterval = window.setInterval(() => {
      console.log('Background sync running...');
      this.syncAll().catch(err => {
        console.error('Background sync error:', err);
      });
    }, intervalMs);

    console.log(`Auto-sync started: every ${intervalMinutes} minute(s)`);
  }

  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  static getLastSyncTime(): Date | null {
    return this.lastSync;
  }

  static isAutoSyncRunning(): boolean {
    return this.syncInterval !== null;
  }
}
