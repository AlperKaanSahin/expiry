jest.mock('../../models', () => ({
  User: { findAndCountAll: jest.fn(), findByPk: jest.fn() },
  Shop: { findByPk: jest.fn(), findAndCountAll: jest.fn(), destroy: jest.fn() },
  AuditLog: { findAndCountAll: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));

const { User, Shop, sequelize } = require('../../models');
const eventBus = require('../../events/eventBus');
const adminService = require('../../services/adminService');

function mockTransaction() {
  const t = { commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) };
  sequelize.transaction.mockResolvedValue(t);
  return t;
}

describe('adminService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('updateUserRole', () => {
    it('geçersiz bir rol verilirse AppError(400) fırlatır', async () => {
      await expect(adminService.updateUserRole(1, 'superadmin', 99)).rejects.toMatchObject({ statusCode: 400 });
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it('kullanıcı bulunamazsa AppError(404) fırlatır', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(adminService.updateUserRole(999, 'admin', 99)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('geçerli rol değişikliğinde audit event yayınlar', async () => {
      const mockUser = { id: 1, email: 'a@b.com', role: 'user', save: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockUser);

      await adminService.updateUserRole(1, 'market', 99);

      expect(mockUser.role).toBe('market');
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ actorId: 99, oldRole: 'user', newRole: 'market' })
      );
    });
  });

  describe('deleteUser — kendini silme koruması', () => {
    it('bir admin kendi hesabını silmeye çalışırsa AppError(400) fırlatır', async () => {
      await expect(adminService.deleteUser(99, 99)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('başka bir kullanıcıyı silebilir', async () => {
      const mockUser = { id: 5, email: 'x@y.com', destroy: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockUser);

      await adminService.deleteUser(5, 99);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalled();
    });
  });

  describe('updateShopStatus — durum geçiş kuralları', () => {
    it('shop bulunamazsa AppError(404) fırlatır', async () => {
      Shop.findByPk.mockResolvedValue(null);

      await expect(adminService.updateShopStatus(999, 'active', 99)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('geçersiz bir status değeri AppError(400) fırlatır', async () => {
      Shop.findByPk.mockResolvedValue({ status: 'pending' });

      await expect(adminService.updateShopStatus(1, 'yamuk-status', 99)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('izin verilmeyen bir geçiş (rejected -> active) AppError(400) fırlatır', async () => {
      Shop.findByPk.mockResolvedValue({ status: 'rejected' });

      await expect(adminService.updateShopStatus(1, 'active', 99)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('geçerli geçişte (pending -> active) shop onaylanır ve sahibinin rolü market olur', async () => {
      const mockShop = { id: 1, name: 'Market', status: 'pending', ownerId: 5, save: jest.fn().mockResolvedValue(true) };
      Shop.findByPk.mockResolvedValue(mockShop);
      const mockOwner = { id: 5, role: 'user', save: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockOwner);

      await adminService.updateShopStatus(1, 'active', 99);

      expect(mockShop.status).toBe('active');
      expect(mockOwner.role).toBe('market');
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('rejected geçişte sahibinin rolü tekrar user olur', async () => {
      const mockShop = { id: 1, name: 'Market', status: 'pending', ownerId: 5, save: jest.fn().mockResolvedValue(true) };
      Shop.findByPk.mockResolvedValue(mockShop);
      const mockOwner = { id: 5, role: 'market', save: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockOwner);

      await adminService.updateShopStatus(1, 'rejected', 99);

      expect(mockOwner.role).toBe('user');
    });
  });

  describe('updateShop', () => {
  it('shop bulunamazsa AppError(404) fırlatır', async () => {
    Shop.findByPk.mockResolvedValue(null);

    await expect(
      adminService.updateShop(999, { name: 'X', address: 'Y', phone: 'Z' }, 99)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('geçerli güncellemede shop kaydedilir ve audit event yayınlanır', async () => {
    const mockShop = {
      id: 1, name: 'Eski', address: 'Eski Adres', phone: '000',
      dataValues: { id: 1, name: 'Eski', address: 'Eski Adres', phone: '000' },
      save: jest.fn().mockResolvedValue(true),
    };
    Shop.findByPk.mockResolvedValue(mockShop);

    await adminService.updateShop(1, { name: 'Yeni', address: 'Yeni Adres', phone: '111' }, 99);

    expect(mockShop.name).toBe('Yeni');
    expect(mockShop.save).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('unique constraint hatası alınırsa AppError(409) fırlatır', async () => {
    const mockShop = {
      id: 1, name: 'Eski', address: 'Eski Adres', phone: '000',
      save: jest.fn().mockRejectedValue({ name: 'SequelizeUniqueConstraintError' }),
    };
    Shop.findByPk.mockResolvedValue(mockShop);

    await expect(
      adminService.updateShop(1, { name: 'Çakışan İsim', address: 'A', phone: 'B' }, 99)
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(eventBus.emit).not.toHaveBeenCalled();
  });
});

  describe('deleteShop — transaction rollback', () => {
    it('shop bulunamazsa AppError(404) fırlatır', async () => {
      Shop.findByPk.mockResolvedValue(null);

      await expect(adminService.deleteShop(999, 99)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('transaction içinde bir hata olursa rollback yapar', async () => {
      const t = mockTransaction();
      Shop.findByPk.mockResolvedValue({ id: 1, name: 'X', address: 'Y', ownerId: 5 });
      User.destroy = jest.fn().mockRejectedValue(new Error('DB hatası'));

      await expect(adminService.deleteShop(1, 99)).rejects.toThrow();

      expect(t.rollback).toHaveBeenCalled();
      expect(t.commit).not.toHaveBeenCalled();
    });

    it('Shop.destroy başarısız olursa da rollback yapar (transaction parametresinin doğru bağlandığını doğrular)', async () => {
  const t = mockTransaction();
  Shop.findByPk.mockResolvedValue({ id: 1, name: 'X', address: 'Y', ownerId: 5 });
  User.destroy = jest.fn().mockResolvedValue(true);
  Shop.destroy = jest.fn().mockRejectedValue(new Error('DB hatası'));

  await expect(adminService.deleteShop(1, 99)).rejects.toThrow();

  expect(Shop.destroy).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id: 1 }, transaction: t })
  );
  expect(t.rollback).toHaveBeenCalled();
  expect(t.commit).not.toHaveBeenCalled();
});
  });
});