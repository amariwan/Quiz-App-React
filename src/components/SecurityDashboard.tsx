/**
 * Security Dashboard Component
 * Displays security monitoring and encryption status
 */

'use client';

import { SecureApiClient } from '@/lib/secure-api-client';
import { SecurityLevel, SecurityMonitor } from '@/lib/security-monitor';
import { useEffect, useState } from 'react';

export function SecurityDashboard(): React.ReactElement | null {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [summary, setSummary] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const updateSummary = () => {
      setSummary(SecureApiClient.getSecuritySummary());
      setRecentEvents(SecurityMonitor.getRecentEvents(10));
    };

    updateSummary();
    const interval = setInterval(updateSummary, 2000);

    const unsubscribe = SecurityMonitor.subscribe(() => {
      updateSummary();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (!summary) return null;

  const getLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.CRITICAL:
        return '#ff4444';
      case SecurityLevel.WARNING:
        return '#ffaa00';
      case SecurityLevel.INFO:
        return '#44ff44';
      default:
        return '#666';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        maxWidth: expanded ? '500px' : '300px',
        zIndex: 9999,
        fontSize: '12px',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>🔒 Security Monitor</div>
        <div style={{ fontSize: '18px' }}>{expanded ? '−' : '+'}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: summary.hasEncryptionKey ? '#44ff44' : '#ff4444',
            }}
          />
          <span>Encryption: {summary.hasEncryptionKey ? 'Active' : 'Inactive'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: summary.hasEncryptedData ? '#44ff44' : '#666',
            }}
          />
          <span>Encrypted Data: {summary.hasEncryptedData ? 'Stored' : 'None'}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
          Session: {summary.sessionId.substring(0, 16)}...
        </div>
      </div>

      {expanded && (
        <>
          <div style={{ marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Event Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div>
                <span style={{ color: '#999' }}>Total:</span> {summary.securityEvents.totalEvents}
              </div>
              <div>
                <span style={{ color: getLevelColor(SecurityLevel.CRITICAL) }}>Critical:</span>{' '}
                {summary.securityEvents.criticalCount}
              </div>
              <div>
                <span style={{ color: getLevelColor(SecurityLevel.WARNING) }}>Warnings:</span>{' '}
                {summary.securityEvents.warningCount}
              </div>
              <div>
                <span style={{ color: getLevelColor(SecurityLevel.INFO) }}>Info:</span>{' '}
                {summary.securityEvents.infoCount}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '10px', borderTop: '1px solid #333' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Recent Events</div>
            <div
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                fontSize: '10px',
              }}
            >
              {recentEvents.length === 0 ? (
                <div style={{ color: '#999' }}>No events yet</div>
              ) : (
                recentEvents.map((event, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '5px',
                      marginBottom: '3px',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${getLevelColor(event.level)}`,
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      {event.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ color: '#999' }}>{event.message}</div>
                    <div style={{ color: '#666', fontSize: '9px' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ paddingTop: '10px', borderTop: '1px solid #333', marginTop: '10px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const events = SecurityMonitor.exportEvents();
                const blob = new Blob([events], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `security-audit-${Date.now()}.json`;
                a.click();
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              📥 Export Audit Log
            </button>
          </div>
        </>
      )}
    </div>
  );
}
