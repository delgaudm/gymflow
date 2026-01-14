import { useState, useEffect } from 'react';

export function useFormState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const clearState = () => {
    sessionStorage.removeItem(key);
    setValue(initialValue);
  };

  return [value, setValue, clearState];
}
