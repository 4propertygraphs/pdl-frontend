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
      const apiUrl = "https://api2.4pm.ie/api/Agency/GetAgency?Key=RDlaeFVPN004a0hvJTJmWUJIQTN3TVdnJTNkJTNk0";
      const response = await fetch(apiUrl);

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
      const apiUrl = `https://api2.4pm.ie/api/properties?Key=${agencyKey}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(`Failed to fetch properties for ${agencyKey}: ${response.status}`);
        return;
      }

      const properties = await response.json();

      if (!Array.isArray(properties) || properties.length === 0) {
        return;
      }

      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('unique_key', agencyKey)
        .maybeSingle();

      if (!agency) {
        return;
      }

      for (const property of properties) {
        const propertyData = {
          agency_name: agency.name,
          house_location: property.Address || '',
          house_price: property.Price || 0,
          house_bedrooms: property.BedRooms || 0,
          house_bathrooms: property.BathRooms || 0,
          images_url_house: property.PrimaryImage || null,
          house_extra_info_1: property.Type || null,
          house_extra_info_2: property.Status || null,
          house_extra_info_3: property.ShortDescription || null,
          agency_agent_name: property.Agent || null,
        };

        await supabase
          .from('properties')
          .upsert(propertyData, {
            onConflict: 'agency_name,house_location',
            ignoreDuplicates: false
          });
      }
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

    for (const agency of agencies) {
      if (agency.unique_key) {
        try {
          await this.syncPropertiesForAgency(agency.unique_key);
        } catch (error) {
          console.error(`Failed to sync properties for agency ${agency.unique_key}:`, error);
        }
      }
    }
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
