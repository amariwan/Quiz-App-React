import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import useCounter from './useCounter';

function TestComponent({ initial = 0 }: { initial?: number }) {
  const { value, add, reset } = useCounter(initial);

  return (
    <div>
      <div data-testid="value">{value}</div>
      <button onClick={add}>add</button>
      <button onClick={reset}>reset</button>
    </div>
  );
}

describe('useCounter hook', () => {
  it('initializes with the provided value and increments/reset correctly', () => {
    render(<TestComponent initial={3} />);

    const value = screen.getByTestId('value');
    expect(value).toHaveTextContent('3');

    const addBtn = screen.getByText('add');
    fireEvent.click(addBtn);
    expect(value).toHaveTextContent('4');

    fireEvent.click(addBtn);
    expect(value).toHaveTextContent('5');

    const resetBtn = screen.getByText('reset');
    fireEvent.click(resetBtn);
    expect(value).toHaveTextContent('0');
  });
});
