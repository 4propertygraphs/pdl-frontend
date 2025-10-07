import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class SyncService {
  private static syncInterval: number | null = null;
  private static lastSync: Date | null = null;
  private static isInitialized = false;

  static async syncAgencies(): Promise<void> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-agencies`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Agencies synced:', result);
      this.lastSync = new Date();
      return result;
    } catch (error) {
      console.error('Failed to sync agencies:', error);
      throw error;
    }
  }

  static async syncPropertiesForAgency(agencyKey: string): Promise<void> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/sync-properties?key=${agencyKey}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Properties synced:', result);
      return result;
    } catch (error) {
      console.error('Failed to sync properties:', error);
      throw error;
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

  static startAutoSync(intervalHours: number = 1): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;

    this.syncAll();

    this.syncInterval = window.setInterval(() => {
      this.syncAll();
    }, intervalMs);

    console.log(`Auto-sync started: every ${intervalHours} hour(s)`);
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
