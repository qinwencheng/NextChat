"use client";

import { useEffect } from "react";

export function BackupScheduler() {
  useEffect(() => {
    // Dynamically import to avoid circular dependencies
    import("../store/autobackup").then(({ useAutoBackupStore }) => {
      const checkAndBackup = () => {
        const store = useAutoBackupStore.getState();
        if (store.enabled && store.shouldCreateBackup()) {
          console.log("[AutoBackup] Creating backup...");
          store.createBackup();
        }
      };

      // Check on mount
      checkAndBackup();

      // Set up interval (check every 5 minutes)
      const intervalId = setInterval(checkAndBackup, 5 * 60 * 1000);

      return () => clearInterval(intervalId);
    });
  }, []);

  return null;
}
