import Locale from "../../locales";

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const formatTime = (timestamp: number): string => {
  if (timestamp === 0) return Locale.Settings.AutoBackup.Never;
  return new Date(timestamp).toLocaleString();
};
