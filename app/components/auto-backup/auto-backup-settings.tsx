import { useAutoBackupStore } from "../../store/autobackup";
import { getClientConfig } from "../../config/client";
import { List, ListItem } from "../ui-lib";
import { IconButton } from "../button";
import { InputRange } from "../input-range";
import Locale from "../../locales";
import styles from "./auto-backup.module.scss";

export function AutoBackupItems() {
  const autoBackupStore = useAutoBackupStore();
  const isApp = !!getClientConfig()?.isApp;

  return (
    <>
      <List>
        <ListItem
          title={Locale.Settings.AutoBackup.Title}
          subTitle={Locale.Settings.AutoBackup.IntervalDesc(
            autoBackupStore.intervalHours,
          )}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              minWidth: "60%",
            }}
          >
            <div
              style={
                !autoBackupStore.enabled
                  ? {
                      pointerEvents: "none",
                      opacity: 0.5,
                      filter: "grayscale(100%)",
                      width: "100%",
                    }
                  : { width: "100%" }
              }
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
                className={styles["full-width-range"]}
              ></InputRange>
            </div>
            <input
              type="checkbox"
              checked={autoBackupStore.enabled}
              onChange={(e) =>
                autoBackupStore.updateSettings({ enabled: e.target.checked })
              }
            ></input>
          </div>
        </ListItem>

        {autoBackupStore.enabled && isApp && (
          <ListItem
            title={Locale.Settings.AutoBackup.BackupPath}
            subTitle={
              autoBackupStore.backupPath ||
              Locale.Settings.AutoBackup.DefaultPath
            }
          >
            <div
              style={{
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "12px",
                color: "var(--gray)",
              }}
              title={autoBackupStore.backupPath}
            >
              {autoBackupStore.backupPath ||
                Locale.Settings.AutoBackup.DefaultPath}
            </div>
            <IconButton
              text={Locale.Settings.AutoBackup.SelectPath}
              onClick={() => autoBackupStore.selectBackupPath()}
              bordered
            />
          </ListItem>
        )}
      </List>
    </>
  );
}
