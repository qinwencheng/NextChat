import { useState } from "react";
import { useAutoBackupStore } from "../../store/autobackup";
import { IconButton } from "../button";
import { List, ListItem, Modal, showToast } from "../ui-lib";
import Locale from "../../locales";
import DownloadIcon from "../../icons/download.svg";
import UploadIcon from "../../icons/upload.svg";
import ClearIcon from "../../icons/clear.svg";
import { formatBytes, formatTime } from "./backup-utils";

export function BackupManagerModal(props: { onClose: () => void }) {
  const autoBackupStore = useAutoBackupStore();
  const [loading, setLoading] = useState(false);

  const handleRestore = async (backupId: string) => {
    if (!confirm(Locale.BackupManager.DeleteConfirm)) return;
    setLoading(true);
    try {
      await autoBackupStore.restoreBackup(backupId);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (backupId: string) => {
    setLoading(true);
    try {
      await autoBackupStore.exportBackup(backupId);
      showToast(Locale.BackupManager.ExportSuccess);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm(Locale.BackupManager.DeleteConfirm)) return;
    setLoading(true);
    try {
      await autoBackupStore.deleteBackup(backupId);
      showToast(Locale.BackupManager.DeleteSuccess);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.BackupManager.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            key="close"
            text={Locale.UI.Close}
            onClick={props.onClose}
            bordered
          />,
        ]}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {autoBackupStore.backupHistory.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                color: "var(--gray)",
              }}
            >
              {Locale.Settings.AutoBackup.NoBackupsYet}
            </div>
          ) : (
            <List>
              {autoBackupStore.backupHistory.map((backup) => (
                <ListItem
                  key={backup.id}
                  title={backup.fileName}
                  subTitle={`${formatTime(backup.timestamp)} · ${formatBytes(
                    backup.size,
                  )} · ${backup.sessionCount} sessions, ${
                    backup.messageCount
                  } messages`}
                >
                  <div style={{ display: "flex", gap: "5px" }}>
                    <IconButton
                      icon={<DownloadIcon />}
                      text={Locale.BackupManager.Restore}
                      onClick={() => handleRestore(backup.id)}
                      disabled={loading}
                    />
                    <IconButton
                      icon={<UploadIcon />}
                      text={Locale.BackupManager.Export}
                      onClick={() => handleExport(backup.id)}
                      disabled={loading}
                    />
                    <IconButton
                      icon={<ClearIcon />}
                      text={Locale.BackupManager.Delete}
                      onClick={() => handleDelete(backup.id)}
                      disabled={loading}
                    />
                  </div>
                </ListItem>
              ))}
            </List>
          )}
        </div>
      </Modal>
    </div>
  );
}
