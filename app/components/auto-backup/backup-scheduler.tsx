"use client";

import { useEffect } from "react";
import { useAutoBackupStore } from "../../store/autobackup";

export function BackupScheduler() {
  useEffect(() => {
    // Check on mount
    const store = useAutoBackupStore.getState();
    if (store.enabled && store.shouldCreateBackup()) {
      console.log("[AutoBackup] Creating backup (initial check)...");
      store.createBackup();
    }

    // Set up interval (check every 5 minutes)
    const intervalId = setInterval(
      () => {
        const store = useAutoBackupStore.getState();
        if (store.enabled && store.shouldCreateBackup()) {
          console.log("[AutoBackup] Creating backup...");
          store.createBackup();
        }
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(intervalId);
  }, []);

  return null;
}
