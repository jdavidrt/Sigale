import { useState, useEffect } from "react";
import { saveToStorage, loadFromStorage } from "../utils/storage";

export const useLocalStorage = (initialValue) => {
  const [data, setData] = useState(() => {
    const stored = loadFromStorage();
    return stored || initialValue;
  });

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  return [data, setData];
};
