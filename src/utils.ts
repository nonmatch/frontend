// Hook

import { useEffect, useState } from "react";
import { COMPILE_PATH, LOCAL_CEXPLORE_HOST, CAT_PATH, REMOTE_CEXPLORE_HOST, FORMATTER_HOST, FORMATTER_PATH } from "./constants";

// https://usehooks.com/useLocalStorage/
export function useLocalStorage(key: string, initialValue: any) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: any) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

export const openInNewTab = (url: string): void => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
  if (newWindow) newWindow.opener = null
}

export const makeSortable = () => {
  (window as any).Sortable.init();
};

export const showTooltips = () => {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new (window as any).bootstrap.Tooltip(tooltipTriggerEl)
  })
};

const getCExploreHost = () => {
  if (localStorage.getItem('useLocalCExplore') === 'true') {
    return LOCAL_CEXPLORE_HOST;
  } else {
    return REMOTE_CEXPLORE_HOST;
  }
}

export const getCompileURL = () => {
  return getCExploreHost() + COMPILE_PATH;
}

export const getCatURL = () => {
  return getCExploreHost() + CAT_PATH;
}

export const getFormatterURL = () => {
  return FORMATTER_HOST + FORMATTER_PATH;
}


// https://stackoverflow.com/a/64352116
export function useTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    return () => {
      document.title = prevTitle
    }
  })
}