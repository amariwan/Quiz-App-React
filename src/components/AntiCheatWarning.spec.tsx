import { AntiCheat, CheatType } from '@/lib/anti-cheat';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AntiCheatWarning from './AntiCheatWarning';

jest.mock('@/lib/anti-cheat', () => {
  const listeners: ((event: any) => void)[] = [];
  const AntiCheat = {
    addEventListener: jest.fn((fn: (e: any) => void) => {
      listeners.push(fn);
    }),
    removeEventListener: jest.fn((fn: (e: any) => void) => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    getSuspicionScore: jest.fn(() => 0),
    // helper for tests to trigger events
    __trigger: (event: any) => {
      // copy to avoid mutation issues
      [...listeners].forEach((fn) => fn(event));
    },
  };

  const CheatType = {
    TAB_SWITCH: 'TAB_SWITCH',
    COPY_ATTEMPT: 'COPY_ATTEMPT',
    PASTE_ATTEMPT: 'PASTE_ATTEMPT',
    CONTEXT_MENU: 'CONTEXT_MENU',
    DEVELOPER_TOOLS: 'DEVELOPER_TOOLS',
    SUSPICIOUS_SPEED: 'SUSPICIOUS_SPEED',
    PATTERN_DETECTION: 'PATTERN_DETECTION',
  } as const;

  return { AntiCheat, CheatType };
});

describe('AntiCheatWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure default suspicion score is 0 unless test overrides
    (AntiCheat.getSuspicionScore as jest.Mock).mockImplementation(() => 0);
  });

  it('does not render anything initially', () => {
    const { container } = render(<AntiCheatWarning />);
    expect(container.firstChild).toBeNull();
    expect(AntiCheat.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('shows correct message for TAB_SWITCH event and auto-hides after 5s for low severity', () => {
    jest.useFakeTimers();
    const { container } = render(<AntiCheatWarning />);

    act(() => {
      (AntiCheat as any).__trigger({
        type: CheatType.TAB_SWITCH,
        severity: 'low',
      });
    });

    expect(screen.getByText(/Tab switching detected/i)).toBeDefined();
    // auto-hide after 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(container.firstChild).toBeNull();
    jest.useRealTimers();
  });

  it('displays suspicion score when > 0', () => {
    (AntiCheat.getSuspicionScore as jest.Mock).mockImplementation(() => 42);
    render(<AntiCheatWarning />);

    act(() => {
      (AntiCheat as any).__trigger({
        type: CheatType.DEVELOPER_TOOLS,
        severity: 'medium',
      });
    });

    expect(screen.getByText(/Developer tools detected/i)).toBeDefined();
    expect(screen.getByText(/Suspicion Score: 42\/100/i)).toBeDefined();
  });

  it('close button hides the warning immediately', () => {
    render(<AntiCheatWarning />);

    act(() => {
      (AntiCheat as any).__trigger({
        type: CheatType.COPY_ATTEMPT,
        severity: 'medium',
      });
    });

    const close = screen.getByLabelText('Close warning');
    expect(screen.getByText(/Copying is disabled/i)).toBeDefined();

    act(() => {
      fireEvent.click(close);
    });

    // after clicking close the warning should be removed
    expect(screen.queryByText(/Copying is disabled/i)).toBeNull();
  });

  it('removes event listener on unmount', () => {
    const { unmount } = render(<AntiCheatWarning />);
    expect(AntiCheat.addEventListener).toHaveBeenCalledTimes(1);

    unmount();
    // ensure removeEventListener was called when unmounted
    expect(AntiCheat.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('renders messages for all known cheat types', () => {
    render(<AntiCheatWarning />);

    const cases: Array<[any, RegExp]> = [
      [CheatType.TAB_SWITCH, /Tab switching detected/i],
      [CheatType.COPY_ATTEMPT, /Copying is disabled/i],
      [CheatType.PASTE_ATTEMPT, /Pasting is disabled/i],
      [CheatType.CONTEXT_MENU, /Right-click is disabled/i],
      [CheatType.DEVELOPER_TOOLS, /Developer tools detected/i],
      [CheatType.SUSPICIOUS_SPEED, /Answer speed is being monitored/i],
      [CheatType.PATTERN_DETECTION, /Unusual answer pattern detected/i],
    ];

    cases.forEach(([type, re]) => {
      act(() => {
        // use medium severity so it doesn't auto-hide
        (AntiCheat as any).__trigger({ type, severity: 'medium' });
      });

      expect(screen.getByText(re)).toBeDefined();
    });
  });

  it('falls back to default message for unknown cheat types', () => {
    render(<AntiCheatWarning />);

    act(() => {
      (AntiCheat as any).__trigger({ type: 'UNKNOWN_TYPE', severity: 'medium' });
    });

    expect(screen.getByText(/Suspicious activity detected/i)).toBeDefined();
  });

  it('high severity shows Security Alert heading and red color', () => {
    const { container } = render(<AntiCheatWarning />);

    act(() => {
      (AntiCheat as any).__trigger({ type: CheatType.PATTERN_DETECTION, severity: 'high' });
    });

    // heading
    expect(screen.getByText(/Security Alert!/i)).toBeDefined();

    // check inline background color applied for high severity
    const wrapper = container.firstChild as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    // style.backgroundColor should be the high severity color
    expect((wrapper as HTMLElement).style.backgroundColor).toBe('#f44336');
  });
});
