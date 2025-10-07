const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class SyncService {
  private static syncInterval: number | null = null;
  private static lastSync: Date | null = null;

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
    } catch (error) {
      console.error('Failed to sync properties:', error);
      throw error;
    }
  }

  static async syncAll(): Promise<void> {
    await this.syncAgencies();
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
