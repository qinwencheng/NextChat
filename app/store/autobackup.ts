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
 * Metadata for a single backup file
 */
export interface BackupRecord {
  id: string; // Unique identifier
  timestamp: number; // Creation time
  fileName: string; // File name
  size: number; // File size in bytes
  sessionCount: number; // Number of chat sessions
  messageCount: number; // Total messages
}

/**
 * Auto-backup store state
 */
export interface AutoBackupState {
  enabled: boolean; // Feature toggle
  intervalHours: number; // Backup frequency (1-168 hours)
  maxBackups: number; // Max files to retain (1-50)
  backupPath: string; // User-configurable backup directory path (Desktop only)
  lastBackupTime: number; // Timestamp of last backup
  lastBackupHash: string; // Hash of last backup to detect changes
  backupHistory: BackupRecord[]; // Metadata of all backups
  totalSize: number; // Total size of all backups (bytes)
}

/**
 * Default configuration
 */
const DEFAULT_AUTO_BACKUP_STATE: AutoBackupState = {
  enabled: false, // Opt-in
  intervalHours: 24, // Daily backups
  maxBackups: 10, // Retain last 10 backups
  backupPath: "", // Will use platform default if empty
  lastBackupTime: 0,
  lastBackupHash: "",
  backupHistory: [],
  totalSize: 0,
};

/**
 * Maximum total size limit (100 MB)
 */
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

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
      const timeSinceLastBackup = now - state.lastBackupTime;
      const intervalMs = state.intervalHours * 60 * 60 * 1000;

      // Check if interval has passed
      if (timeSinceLastBackup < intervalMs) return false;

      // Check total size
      if (state.totalSize > MAX_TOTAL_SIZE) {
        console.warn("[AutoBackup] Total size exceeded limit, skipping backup");
        return false;
      }

      // Check if data has changed since last backup
      const { content, stats } = exportAppState();
      // Calculate a more reliable hash based on content length, last update time, and stats
      // This is a lightweight approximation of content hashing
      const currentHash = simpleHash(
        `${content.length}-${state.lastBackupTime}-${stats.sessionCount}-${stats.messageCount}`,
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
          // Desktop: Save to file system
          const backupDir = state.backupPath || (await getDefaultBackupPath());

          // Ensure directory exists
          await window.__TAURI__.fs.createDir(backupDir, { recursive: true });

          const filePath = `${backupDir}/${fileName}`;
          await window.__TAURI__.fs.writeTextFile(filePath, content);
        } else {
          // Web: Save to IndexedDB
          const { set: idbSet } = await import("idb-keyval");
          await idbSet(`autobackup-${id}`, content);
        }

        // Update history
        set((state) => ({
          backupHistory: [
            ...state.backupHistory,
            {
              id,
              timestamp: Date.now(),
              fileName,
              size: stats.totalSize,
              sessionCount: stats.sessionCount,
              messageCount: stats.messageCount,
            },
          ].sort((a, b) => a.timestamp - b.timestamp),
          totalSize: state.totalSize + stats.totalSize,
        }));

        // Update hash and timestamp
        const currentHash = simpleHash(
          `${content.length}-${state.lastBackupTime}-${stats.sessionCount}-${stats.messageCount}`,
        );
        set({
          lastBackupHash: currentHash,
          lastBackupTime: Date.now(),
        });

        // Rotate if needed
        if (state.backupHistory.length > state.maxBackups) {
          // Using type assertion to access internal method within store actions if needed,
          // but here we can just call the function directly as it is part of the object we are returning
          await (get() as any).deleteOldestBackup();
        }

        console.log(`[AutoBackup] Backup created: ${fileName}`);
      } catch (error) {
        console.error("[AutoBackup] Failed to create backup:", error);
      }
    },

    deleteOldestBackup: async () => {
      const state = get();
      if (state.backupHistory.length === 0) return;

      const oldest = state.backupHistory[0];
      await (get() as any).deleteBackup(oldest.id);
      console.log(`[AutoBackup] Rotated oldest backup: ${oldest.fileName}`);
    },

    deleteBackup: async (backupId: string) => {
      const state = get();
      const backup = state.backupHistory.find((b) => b.id === backupId);

      if (!backup) return;

      try {
        if (isApp && window.__TAURI__) {
          const backupDir = state.backupPath || (await getDefaultBackupPath());
          const filePath = `${backupDir}/${backup.fileName}`;
          await window.__TAURI__.fs.removeFile(filePath);
        } else {
          const { del } = await import("idb-keyval");
          await del(`autobackup-${backupId}`);
        }

        set((state) => {
          const backupToRemove = state.backupHistory.find(
            (b) => b.id === backupId,
          );
          if (!backupToRemove) return state;

          return {
            backupHistory: state.backupHistory.filter((b) => b.id !== backupId),
            totalSize: state.totalSize - backupToRemove.size,
          };
        });
        console.log(`[AutoBackup] Deleted backup: ${backup.fileName}`);
      } catch (error) {
        console.error("[AutoBackup] Failed to delete backup:", error);
      }
    },

    clearAllBackups: async () => {
      const state = get();

      for (const backup of state.backupHistory) {
        await (get() as any).deleteBackup(backup.id);
      }

      set({
        backupHistory: [],
        totalSize: 0,
        lastBackupTime: 0,
        lastBackupHash: "",
      });

      console.log("[AutoBackup] All backups cleared");
    },

    restoreBackup: async (backupId: string) => {
      try {
        const content = await (get() as any).loadBackupContent(backupId);

        const { getLocalAppState, mergeAppState, setLocalAppState } =
          await import("../utils/sync");

        const backupState = JSON.parse(content);

        // Validate structure
        if (!backupState.chat || !backupState.config || !backupState.access) {
          throw new Error("Invalid backup format");
        }

        // Merge with local state
        const localState = getLocalAppState();
        mergeAppState(localState, backupState);
        setLocalAppState(localState);

        const { showToast } = await import("../components/ui-lib");
        const Locale = (await import("../locales")).default;
        showToast(
          Locale.BackupManager?.RestoreSuccess ||
            "Backup restored successfully",
        );

        // Reload page to apply changes
        location.reload();
      } catch (error) {
        console.error("[AutoBackup] Failed to restore backup:", error);
        const { showToast } = await import("../components/ui-lib");
        const Locale = (await import("../locales")).default;
        showToast(
          Locale.BackupManager?.RestoreFailed || "Failed to restore backup",
        );
      }
    },

    exportBackup: async (backupId: string) => {
      try {
        const state = get();
        const backup = state.backupHistory.find((b) => b.id === backupId);

        if (!backup) {
          throw new Error("Backup not found");
        }

        const content = await (get() as any).loadBackupContent(backupId);

        const { downloadAs } = await import("../utils");
        downloadAs(content, backup.fileName);
      } catch (error) {
        console.error("[AutoBackup] Failed to export backup:", error);
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

    addBackupRecord: (record: BackupRecord) => {
      set((state) => ({
        backupHistory: [...state.backupHistory, record].sort(
          (a, b) => a.timestamp - b.timestamp,
        ),
        totalSize: state.totalSize + record.size,
      }));
    },

    removeBackupRecord: (backupId: string) => {
      set((state) => {
        const backup = state.backupHistory.find((b) => b.id === backupId);
        if (!backup) return state;

        return {
          backupHistory: state.backupHistory.filter((b) => b.id !== backupId),
          totalSize: state.totalSize - backup.size,
        };
      });
    },

    loadBackupContent: async (backupId: string) => {
      const state = get();

      if (isApp && window.__TAURI__) {
        const backup = state.backupHistory.find((b) => b.id === backupId);
        if (!backup) throw new Error("Backup not found");

        const backupDir = state.backupPath || (await getDefaultBackupPath());
        const filePath = `${backupDir}/${backup.fileName}`;
        return await window.__TAURI__.fs.readTextFile(filePath);
      } else {
        const { get: idbGet } = await import("idb-keyval");
        const content = await idbGet<string>(`autobackup-${backupId}`);
        if (!content) throw new Error("Backup not found");
        return content;
      }
    },
  }),
  {
    name: StoreKey.AutoBackup,
  },
);
