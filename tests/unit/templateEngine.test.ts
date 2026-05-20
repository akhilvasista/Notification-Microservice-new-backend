import { TemplateEngine } from '../../src/templates/TemplateEngine';
import { NotificationTemplate } from '../../src/models/NotificationTemplate';

jest.mock('../../src/models/NotificationTemplate');

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  afterEach(() => jest.clearAllMocks());

  it('renders body with context variables', async () => {
    (NotificationTemplate.findOne as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({
        templateId: 'test_tmpl',
        type: 'email',
        subject: 'Hello {{name}}',
        body: '<p>Hi {{name}}, your date is {{date}}</p>',
        isActive: true,
      }),
    });

    const result = await engine.render('test_tmpl', { name: 'Sandeep', date: 'June 1' });
    expect(result.body).toBe('<p>Hi Sandeep, your date is June 1</p>');
    expect(result.subject).toBe('Hello Sandeep');
  });

  it('throws NotFoundError when template does not exist', async () => {
    (NotificationTemplate.findOne as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve(null),
    });
    await expect(engine.render('missing_tmpl', {})).rejects.toThrow('Template: missing_tmpl not found');
  });

  it('renders push template with title', async () => {
    (NotificationTemplate.findOne as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({
        templateId: 'push_tmpl',
        type: 'push',
        title: '🎉 {{points}} Points!',
        body: 'You earned {{points}} points today.',
        isActive: true,
      }),
    });

    const result = await engine.render('push_tmpl', { points: 50 });
    expect(result.title).toBe('🎉 50 Points!');
    expect(result.body).toBe('You earned 50 points today.');
  });

  it('invalidates cache on demand', async () => {
    // Prime cache
    (NotificationTemplate.findOne as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({
        templateId: 'cached_tmpl',
        type: 'sms',
        body: 'Version 1',
        isActive: true,
      }),
    });
    await engine.render('cached_tmpl', {});

    // Update template
    (NotificationTemplate.findOne as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({
        templateId: 'cached_tmpl',
        type: 'sms',
        body: 'Version 2',
        isActive: true,
      }),
    });

    engine.invalidateCache('cached_tmpl');
    const result = await engine.render('cached_tmpl', {});
    expect(result.body).toBe('Version 2');
  });
});
