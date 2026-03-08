declare module "*.jpg";
declare module "*.png";
declare module "*.woff2";
declare module "*.woff";
declare module "*.ttf";
declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.svg";

declare interface Window {
  __TAURI__?: {
    invoke?: (
      command: string,
      payload?: Record<string, unknown>,
    ) => Promise<any>;
    core?: {
      invoke(command: string, payload?: Record<string, unknown>): Promise<any>;
    };
    event?: {
      listen(
        event: string,
        handler: (event: { id: number; payload: unknown }) => void,
      ): Promise<() => void>;
    };
  };
}
