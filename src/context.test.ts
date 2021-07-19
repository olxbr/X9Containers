import * as context from './context';

describe('minimalSeverity', () => {
  test.each([
    ['', 'UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL'],
    ['LOW', 'LOW,MEDIUM,HIGH,CRITICAL'],
    ['MEDIUM', 'MEDIUM,HIGH,CRITICAL'],
    ['HIGH', 'HIGH,CRITICAL'],
    ['CRITICAL', 'CRITICAL']
  ])('given a severity %p returns all > than current', (config: string, expected: string) => {
    const trivySeverity = context.minimalSeverity(config);
    expect(trivySeverity).toEqual(expected);
  });
});
