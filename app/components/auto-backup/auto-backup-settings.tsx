import { useState } from "react";
import { useAutoBackupStore } from "../../store/autobackup";
import { getClientConfig } from "../../config/client";
import { List, ListItem, showToast } from "../ui-lib";
import { IconButton } from "../button";
import { InputRange } from "../input-range";
import { BackupManagerModal } from "./backup-manager";
import Locale from "../../locales";
import UploadIcon from "../../icons/upload.svg";
import ConfigIcon from "../../icons/config.svg";

export function AutoBackupItems() {
  const autoBackupStore = useAutoBackupStore();
  const [showBackupManager, setShowBackupManager] = useState(false);
  const isApp = !!getClientConfig()?.isApp;

  return (
    <>
      <List>
        <ListItem
          title={Locale.Settings.AutoBackup.Title}
          subTitle={Locale.Settings.AutoBackup.SubTitle}
        >
          <input
            type="checkbox"
            checked={autoBackupStore.enabled}
            onChange={(e) =>
              autoBackupStore.updateSettings({ enabled: e.target.checked })
            }
          ></input>
        </ListItem>

        {autoBackupStore.enabled && (
          <>
            <ListItem
              title={Locale.Settings.AutoBackup.Interval}
              subTitle={Locale.Settings.AutoBackup.IntervalDesc(
                autoBackupStore.intervalHours,
              )}
            >
              <InputRange
                value={autoBackupStore.intervalHours}
                min="1"
                max="168"
                step="1"
                onChange={(e) =>
                  autoBackupStore.updateSettings({
                    intervalHours: parseInt(e.currentTarget.value),
                  })
                }
                aria={Locale.Settings.AutoBackup.Interval}
              ></InputRange>
            </ListItem>

            <ListItem
              title={Locale.Settings.AutoBackup.MaxBackups}
              subTitle={Locale.Settings.AutoBackup.MaxBackupsDesc(
                autoBackupStore.maxBackups,
              )}
            >
              <InputRange
                value={autoBackupStore.maxBackups}
                min="1"
                max="50"
                step="1"
                onChange={(e) =>
                  autoBackupStore.updateSettings({
                    maxBackups: parseInt(e.currentTarget.value),
                  })
                }
                aria={Locale.Settings.AutoBackup.MaxBackups}
              ></InputRange>
            </ListItem>

            {isApp && (
              <ListItem
                title={Locale.Settings.AutoBackup.BackupPath}
                subTitle={
                  autoBackupStore.backupPath ||
                  Locale.Settings.AutoBackup.DefaultPath
                }
              >
                <IconButton
                  text={Locale.Settings.AutoBackup.SelectPath}
                  onClick={() => autoBackupStore.selectBackupPath()}
                  bordered
                />
              </ListItem>
            )}

            <ListItem
              title={Locale.Settings.AutoBackup.Status}
              subTitle={
                Locale.Settings.AutoBackup.BackupCount(
                  autoBackupStore.backupHistory.length,
                ) +
                " · " +
                (autoBackupStore.lastBackupTime === 0
                  ? Locale.Settings.AutoBackup.Never
                  : new Date(autoBackupStore.lastBackupTime).toLocaleString())
              }
            >
              <div style={{ display: "flex" }}>
                <IconButton
                  text={Locale.Settings.AutoBackup.BackupNow}
                  onClick={async () => {
                    try {
                      await autoBackupStore.createBackup();
                      showToast(Locale.Settings.AutoBackup.CreateSuccess);
                    } catch (error) {
                      showToast(Locale.Settings.AutoBackup.CreateFailed);
                    }
                  }}
                  bordered
                  icon={<UploadIcon />}
                />
                <IconButton
                  text={Locale.Settings.AutoBackup.ViewBackups}
                  onClick={() => setShowBackupManager(true)}
                  bordered
                  icon={<ConfigIcon />}
                  style={{ marginLeft: 10 }}
                />
              </div>
            </ListItem>
          </>
        )}
      </List>

      {showBackupManager && (
        <BackupManagerModal onClose={() => setShowBackupManager(false)} />
      )}
    </>
  );
}
