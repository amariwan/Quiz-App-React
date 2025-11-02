import { useState } from 'react';

export default function useCounter(initialState: number) {
  const [value, setValue] = useState(initialState);
  const reset = () => setValue(0);
  const add = () => setValue((v) => v + 1);

  return {
    value,
    add,
    reset,
  };
}
