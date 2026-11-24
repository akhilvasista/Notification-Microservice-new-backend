import { createConfigSchema } from '../../src/validators/notificationConfig.validator';

const baseConfig = {
  event: 'USER_SIGNED_UP',
  name: 'Welcome notification',
  channels: ['email'],
  templateIds: { email: 'welcome-email' },
  schedule: { type: 'delayed', delay: '1d' },
};

describe('notification configuration validation', () => {
  it('accepts a valid delayed notification rule', () => {
    const result = createConfigSchema.validate(baseConfig);
    expect(result.error).toBeUndefined();
  });

  it('requires a delay when the schedule type is delayed', () => {
    const result = createConfigSchema.validate({
      ...baseConfig,
      schedule: { type: 'delayed' },
    });
    expect(result.error).toBeDefined();
  });

  it('rejects unsupported delay formats', () => {
    const result = createConfigSchema.validate({
      ...baseConfig,
      schedule: { type: 'delayed', delay: 'tomorrow' },
    });
    expect(result.error).toBeDefined();
  });

  it('rejects repeat counts below one', () => {
    const result = createConfigSchema.validate({
      ...baseConfig,
      repeat: { count: 0, frequency: 'daily' },
    });
    expect(result.error).toBeDefined();
  });
});
