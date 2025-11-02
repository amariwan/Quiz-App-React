/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockSummary = {
  hasEncryptionKey: true,
  hasEncryptedData: true,
  sessionId: 'abcdefghijklmnopqrstu',
  securityEvents: { totalEvents: 3, criticalCount: 1, warningCount: 1, infoCount: 1 },
};

const mockRecentEvents: any[] = [];

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn((_cb: any) => {
  // optionally call once
  return mockUnsubscribe;
});

jest.mock('@/lib/secure-api-client', () => ({
  SecureApiClient: {
    getSecuritySummary: jest.fn(() => mockSummary),
  },
}));

jest.mock('@/lib/security-monitor', () => ({
  SecurityLevel: { CRITICAL: 'CRITICAL', WARNING: 'WARNING', INFO: 'INFO' },
  SecurityMonitor: {
    getRecentEvents: jest.fn(() => mockRecentEvents),
    subscribe: mockSubscribe,
    exportEvents: jest.fn(() => JSON.stringify([])),
  },
}));

import { SecurityDashboard } from './SecurityDashboard';

describe('SecurityDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders summary and toggles expanded view', () => {
    render(<SecurityDashboard />);

    // encryption summary should be visible
    expect(screen.getByText(/Encryption:/i)).toBeDefined();

    // click the header to expand
    const header = screen.getByText(/Security Monitor/i);
    fireEvent.click(header);

    expect(screen.getByText(/Event Summary/i)).toBeDefined();
  });

  it('exports audit log when button clicked', () => {
    // mock createObjectURL and anchor click
    const createObjectURL = (URL.createObjectURL = jest.fn(() => 'blob://u'));
    const aClick = jest.fn();

    const origCreateElement = document.createElement;
    jest.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
      if (tagName === 'a') {
        return { href: '', download: '', click: aClick } as any;
      }
      return origCreateElement.call(document, tagName);
    });

    render(<SecurityDashboard />);

    // expand first
    fireEvent.click(screen.getByText(/Security Monitor/i));

    const exportBtn = screen.getByText(/Export Audit Log/i);
    fireEvent.click(exportBtn);

    expect(createObjectURL).toHaveBeenCalled();
    expect(aClick).toHaveBeenCalled();
  });
});
