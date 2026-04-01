import { create } from "zustand";

export type RideLog = {
  id: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  from: string;
  to: string;
};

type RideLogState = {
  logs: RideLog[];
  addLog: (log: RideLog) => void;
  clearLogs: () => void;
};

export const useRideLogStore = create<RideLogState>((set) => ({
  logs: [],
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs],
    })),
  clearLogs: () => set({ logs: [] }),
}));