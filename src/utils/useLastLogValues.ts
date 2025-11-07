import { LocalStorage } from "@raycast/api";
import { TimeLogEntry } from "../types";
import { STORAGE_KEYS } from "../constants";


/**
 * Get or update the last time log values for a specific project from local storage.
 */
export const useLastTimeLogValues = () => {

const getLastTimeLogValues = async (project: number): Promise<TimeLogEntry | undefined> => {
  const storedData = await LocalStorage.getItem(STORAGE_KEYS.LAST_LOG_DATA);

  if (storedData) {
    const parsedLogs: {[key: number]: TimeLogEntry} = JSON.parse(storedData as string);
    const logValues = parsedLogs[project];
    if (logValues) {
      return logValues;
    }
  }
    return undefined;
};

  const updateLastTimeLogValues = async (data: TimeLogEntry) => {
    const storedData = await LocalStorage.getItem(STORAGE_KEYS.LAST_LOG_DATA);
    let parsedLogs: {[key: number]: TimeLogEntry} = {};

    if (storedData) {
      parsedLogs = JSON.parse(storedData as string);
    }

    parsedLogs[data.project] = data;

    await LocalStorage.setItem(STORAGE_KEYS.LAST_LOG_DATA, JSON.stringify(parsedLogs));
  };

  return { getLastTimeLogValues, updateLastTimeLogValues };
};

