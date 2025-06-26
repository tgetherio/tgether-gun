// gunRelay.ts
import Gun from "gun";
import { Server } from "http";

let gunInstance: ReturnType<typeof Gun> | null = null;

export const startGunRelay = (server: Server) => {
  if (!gunInstance) {
    gunInstance = Gun({ web: server });
    console.log("🔫 Gun relay started.");
  }
};

export const getGunInstance = () => {
  if (!gunInstance) throw new Error("Gun not initialized yet");
  return gunInstance;
};
