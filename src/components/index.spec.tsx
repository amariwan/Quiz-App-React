import '@testing-library/jest-dom';
import * as components from './index';

describe('components barrel (index)', () => {
  it('exports expected components', () => {
    expect(components).toHaveProperty('AntiCheatWarning');
    expect(components).toHaveProperty('ErrorBoundary');
    expect(components).toHaveProperty('Question');
    expect(components).toHaveProperty('QuestionCorrection');
    expect(components).toHaveProperty('Results');
    // SecurityDashboard is a named export
    expect(components).toHaveProperty('SecurityDashboard');
  });
});
