import { createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

/** A Solid Store which is backed by local storage. It also writes to local storage whenever the
    store is mutated.
 */
export const createLocalStorageStore = <T extends object>(storageKey: string, initialValue: T) => {
  try {
    const json = localStorage.getItem(storageKey);
    if (typeof json === 'string' && json.length > 0) {
      const parsed = JSON.parse(json);
      if (typeof parsed === 'object') {
        initialValue = parsed;
      }
    }
  } catch (e) {
    console.error(`Malformed data for local storage item "${storageKey}".`);
  }

  const store = createStore<T>(initialValue);

  // Create an effect which updates document.cookie when the store is mutated.
  if (!isServer) {
    const [storeValue] = store;
    createEffect(() => {
      localStorage.setItem(storageKey, JSON.stringify(storeValue));
    });
  }

  return store;
};
