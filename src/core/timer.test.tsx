/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useTimer } from './hooks/useTimer';

jest.useFakeTimers();

function TimerTestApp() {
  const t = useTimer({ initial: 0, tickMs: 1000 });
  return (
    <div>
      <div data-testid="seconds">{t.seconds}</div>
      <button onClick={t.start}>start</button>
      <button onClick={t.stop}>stop</button>
      <button onClick={() => t.reset(1)}>reset1</button>
    </div>
  );
}

describe('useTimer', () => {
  test('start increments seconds, stop pauses, reset resets', () => {
    render(<TimerTestApp />);

    const start = screen.getByText('start');
    const stop = screen.getByText('stop');
    const reset1 = screen.getByText('reset1');
    const seconds = () => Number(screen.getByTestId('seconds').textContent || 0);

    fireEvent.click(start);
    expect(seconds()).toBe(0);

    act(() => {
      jest.advanceTimersByTime(3100);
    });
    // after ~3 ticks
    expect(seconds()).toBeGreaterThanOrEqual(3);

    fireEvent.click(stop);
    const stopped = seconds();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(seconds()).toBe(stopped);

    fireEvent.click(reset1);
    expect(seconds()).toBe(1);
  });

  test('reset while running keeps interval alive and supports custom tick', () => {
    function HalfSecondTimer() {
      const timer = useTimer({ initial: 5, tickMs: 500 });
      return (
        <div>
          <div data-testid="seconds">{timer.seconds}</div>
          <button onClick={timer.start}>start</button>
          <button onClick={() => timer.reset(2)}>reset2</button>
        </div>
      );
    }

    render(<HalfSecondTimer />);
    const start = screen.getByText('start');
    const reset2 = screen.getByText('reset2');
    const seconds = () => Number(screen.getByTestId('seconds').textContent || 0);

    fireEvent.click(start);
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(seconds()).toBeCloseTo(5.5, 1);

    fireEvent.click(reset2);
    expect(seconds()).toBe(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // continues ticking from reset value
    expect(seconds()).toBeCloseTo(3, 1);
  });
});
