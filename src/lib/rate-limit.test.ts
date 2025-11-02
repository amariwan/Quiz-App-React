import {
  blockSession,
  checkRateLimit,
  getSessionData,
  isSessionBlocked,
  storeSessionData,
} from './rate-limit';

describe('rate-limit module when Upstash not configured', () => {
  it('checkRateLimit allows request when not configured', async () => {
    const res = await checkRateLimit('id-1');
    expect(res.success).toBe(true);
  });

  it('store/getSessionData are no-ops and do not throw', async () => {
    await expect(storeSessionData('s1', { a: 1 })).resolves.toBeUndefined();
    const d = await getSessionData('s1');
    expect(d).toBeNull();
  });

  it('blockSession and isSessionBlocked are safe when redis not configured', async () => {
    await expect(blockSession('s1', 'reason')).resolves.toBeUndefined();
    const blocked = await isSessionBlocked('s1');
    expect(blocked).toBe(false);
  });
});
