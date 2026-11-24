import { IdempotencyService } from '../../src/services/IdempotencyService';
import { IdempotencyKey } from '../../src/models/IdempotencyKey';

jest.mock('../../src/models/IdempotencyKey');

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  beforeEach(() => {
    service = new IdempotencyService();
  });

  afterEach(() => jest.clearAllMocks());

  it('creates a processing claim for a new notification key', async () => {
    (IdempotencyKey.create as jest.Mock).mockResolvedValue({});
    const result = await service.claim('u1', 'EVENT', 'email', 'tmpl_1');

    expect(result.claimed).toBe(true);
    expect(result.claimToken).toEqual(expect.any(String));
    expect(IdempotencyKey.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      event: 'EVENT',
      channel: 'email',
      status: 'processing',
      claimToken: result.claimToken,
      leaseUntil: expect.any(Date),
    }));
  });

  it('returns not claimed when another worker owns an active claim', async () => {
    (IdempotencyKey.create as jest.Mock).mockRejectedValue({ code: 11000 });
    (IdempotencyKey.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    await expect(service.claim('u1', 'EVENT', 'email', 'tmpl_1'))
      .resolves.toEqual({ claimed: false });
  });

  it('reclaims an expired claim atomically', async () => {
    (IdempotencyKey.create as jest.Mock).mockRejectedValue({ code: 11000 });
    (IdempotencyKey.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    const result = await service.claim('u1', 'EVENT', 'email', 'tmpl_1');

    expect(result.claimed).toBe(true);
    expect(result.claimToken).toEqual(expect.any(String));
    expect(IdempotencyKey.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expect.any(String),
        status: 'processing',
        $or: expect.any(Array),
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          claimToken: result.claimToken,
          leaseUntil: expect.any(Date),
        }),
      }),
      { new: true, runValidators: true }
    );
  });

  it('propagates database failures that are not duplicate-key conflicts', async () => {
    const databaseError = new Error('DB down');
    (IdempotencyKey.create as jest.Mock).mockRejectedValue(databaseError);

    await expect(service.claim('u1', 'EVENT', 'email', 'tmpl_1'))
      .rejects.toBe(databaseError);
  });

  it('marks a notification processed only for the owning claim', async () => {
    (IdempotencyKey.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

    await service.markProcessed('u1', 'EVENT', 'email', 'tmpl_1', 'claim-1');

    expect(IdempotencyKey.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing', claimToken: 'claim-1' }),
      expect.objectContaining({
        $set: { status: 'processed' },
        $unset: { claimToken: 1, leaseUntil: 1 },
      })
    );
  });

  it('fails if claim ownership was lost before completion', async () => {
    (IdempotencyKey.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 0 });

    await expect(
      service.markProcessed('u1', 'EVENT', 'email', 'tmpl_1', 'claim-1')
    ).rejects.toThrow('Idempotency claim ownership was lost before completion');
  });

  it('releases only the claim owned by this worker', async () => {
    (IdempotencyKey.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

    await service.releaseClaim('u1', 'EVENT', 'email', 'tmpl_1', 'claim-1');

    expect(IdempotencyKey.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing', claimToken: 'claim-1' })
    );
  });
});
