import { IdempotencyService } from '../../src/services/IdempotencyService';
import { IdempotencyKey } from '../../src/models/IdempotencyKey';

jest.mock('../../src/models/IdempotencyKey');

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  beforeEach(() => {
    service = new IdempotencyService();
  });

  afterEach(() => jest.clearAllMocks());

  it('returns false (not duplicate) when key does not exist', async () => {
    (IdempotencyKey.findOne as jest.Mock).mockResolvedValue(null);
    const result = await service.isDuplicate('u1', 'EVENT', 'email', 'tmpl_1');
    expect(result).toBe(false);
  });

  it('returns true (duplicate) when key already exists', async () => {
    (IdempotencyKey.findOne as jest.Mock).mockResolvedValue({ key: 'abc', status: 'processed' });
    const result = await service.isDuplicate('u1', 'EVENT', 'email', 'tmpl_1');
    expect(result).toBe(true);
  });

  it('marks notification as processed', async () => {
    (IdempotencyKey.findOneAndUpdate as jest.Mock).mockResolvedValue({});
    await service.markProcessed('u1', 'EVENT', 'email', 'tmpl_1');
    expect(IdempotencyKey.findOneAndUpdate).toHaveBeenCalled();
  });

  it('returns false gracefully when DB throws', async () => {
    (IdempotencyKey.findOne as jest.Mock).mockRejectedValue(new Error('DB down'));
    const result = await service.isDuplicate('u1', 'EVENT', 'email', 'tmpl_1');
    expect(result).toBe(false);
  });
});
