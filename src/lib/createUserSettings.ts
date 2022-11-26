import { createContext, useContext } from 'solid-js';
import { SetStoreFunction, Store } from 'solid-js/store';
import { createLocalStorageStore } from './createLocalStorageStore';

export interface ISettings {
  showHelp?: boolean;
  showTrajectories?: boolean;
  showCompass?: boolean;
}

export const UserSettingsContext = createContext<[Store<ISettings>, SetStoreFunction<ISettings>]>();

export const useUserSettings = () => {
  const settings = useContext(UserSettingsContext);
  if (!settings) {
    throw new Error('Missing context: UserSettings');
  }
  return settings;
};

export const createUserSettings = () =>
  createLocalStorageStore<ISettings>('settings', {
    showTrajectories: true,
    showCompass: true,
  });
