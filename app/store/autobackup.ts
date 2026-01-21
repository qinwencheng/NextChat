import { StoreKey } from "../constant";
import { exportAppState } from "@/app/utils/sync";
import { getClientConfig } from "../config/client";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";

const isApp = !!getClientConfig()?.isApp;

/**
 * Get default backup directory path
 */
async function getDefaultBackupPath(): Promise<string> {
  if (!isApp) return "";
  try {
    const { appDataDir } = await import("@tauri-apps/api/path");
    const appDataPath = await appDataDir();
    return appDataPath ? `${appDataPath}/AutoBackups` : "";
  } catch (error) {
    console.error("[AutoBackup] Failed to get default backup path:", error);
    return "";
  }
}

/**
 * Auto-backup store state
 */
export interface AutoBackupState {
  enabled: boolean; // Feature toggle
  intervalHours: number; // Backup frequency (1-168 hours)
  backupPath: string; // User-configurable backup directory path (Desktop only)
  lastBackupTime: number; // Timestamp of last backup
  lastBackupHash: string; // Hash of markers to detect changes
}

/**
 * Default configuration
 */
const DEFAULT_AUTO_BACKUP_STATE: AutoBackupState = {
  enabled: false, // Opt-in
  intervalHours: 24, // Daily backups
  backupPath: "", // Will use platform default if empty
  lastBackupTime: 0,
  lastBackupHash: "",
};

/**
 * Simple hash function for string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Auto-backup store
 */
export const useAutoBackupStore = createPersistStore(
  DEFAULT_AUTO_BACKUP_STATE,
  (set, get) => ({
    updateSettings: (updates: Partial<AutoBackupState>) => {
      set(updates as any);
    },

    shouldCreateBackup: () => {
      const state = get();
      const now = Date.now();
      const intervalHours = Math.max(1, state.intervalHours || 24);
      const timeSinceLastBackup = now - state.lastBackupTime;
      const intervalMs = intervalHours * 60 * 60 * 1000;

      // 1. Check if interval has passed
      if (timeSinceLastBackup < intervalMs) return false;

      // 2. Check if data has changed since last backup
      const { content, stats } = exportAppState();
      // Use markers that change when data changes, excluding the timestamp of previous backup
      const currentHash = simpleHash(
        `${content.length}-${stats.sessionCount}-${stats.messageCount}`,
      );

      return currentHash !== state.lastBackupHash;
    },

    createBackup: async () => {
      const state = get();

      try {
        // Export state
        const { content, stats } = exportAppState();

        const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
        const id = nanoid(8);
        const fileName = `AutoBackup-${timestamp}-${id}.json`;

        // Platform-specific storage
        if (isApp && window.__TAURI__) {
          const backupDir = state.backupPath || (await getDefaultBackupPath());
          await window.__TAURI__.fs.createDir(backupDir, { recursive: true });
          const filePath = `${backupDir}/${fileName}`;
          await window.__TAURI__.fs.writeTextFile(filePath, content);
        } else {
          const { set: idbSet } = await import("idb-keyval");
          await idbSet(`autobackup-${id}`, content);
        }

        // Update markers for change detection
        const currentHash = simpleHash(
          `${content.length}-${stats.sessionCount}-${stats.messageCount}`,
        );
        set({
          lastBackupHash: currentHash,
          lastBackupTime: Date.now(),
        });

        console.log(`[AutoBackup] Backup created: ${fileName}`);
      } catch (error) {
        console.error("[AutoBackup] Failed to create backup:", error);
      }
    },

    selectBackupPath: async () => {
      if (!isApp || !window.__TAURI__) return;

      try {
        const path = await window.__TAURI__.dialog.open({
          directory: true,
          multiple: false,
          title: "Select Backup Directory",
        });

        if (path && typeof path === "string") {
          set({ backupPath: path });
        }
      } catch (error) {
        console.error("[AutoBackup] Failed to select backup path:", error);
      }
    },
  }),
  {
    name: StoreKey.AutoBackup,
    version: 1.2,
    migrate(persistedState, version) {
      const state = persistedState as any;
      if (version < 1.1) {
        if (!state.intervalHours || state.intervalHours <= 0) {
          state.intervalHours = 24;
        }
      }
      // Remove deprecated fields in 1.2
      if (version < 1.2) {
        delete state.backupHistory;
        delete state.maxBackups;
        delete state.totalSize;
      }
      return state as any;
    },
  },
);
