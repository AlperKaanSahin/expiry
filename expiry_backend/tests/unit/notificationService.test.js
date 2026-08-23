jest.mock('../../models', () => ({
  Notification: {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
}));

const { Notification } = require('../../models');
const notificationService = require('../../services/notificationService');

describe('notificationService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createNotification', () => {
    it('userId veya title eksikse AppError(400) fırlatır', async () => {
      await expect(notificationService.createNotification({ title: 'X' })).rejects.toMatchObject({ statusCode: 400 });
      await expect(notificationService.createNotification({ userId: 1 })).rejects.toMatchObject({ statusCode: 400 });
      expect(Notification.create).not.toHaveBeenCalled();
    });

    it('geçerli veriyle bildirim oluşturur', async () => {
      Notification.create.mockResolvedValue({ id: 1 });

      await notificationService.createNotification({ userId: 1, title: 'Başlık', message: 'Mesaj', type: 'ORDER_NEW' });

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 1, title: 'Başlık', message: 'Mesaj', type: 'ORDER_NEW', targetId: null, orderId: null, isRead: false,
      });
    });
  });

  describe('markAsRead — ownership', () => {
    it('başka bir kullanıcının bildirimini okundu işaretlemeye çalışırsa AppError(404) fırlatır', async () => {
      Notification.findOne.mockResolvedValue(null); // userId filtresiyle bulunamadı

      await expect(notificationService.markAsRead(5, 999)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('sorguyu hem id hem userId ile filtreler', async () => {
      const mockNotif = { isRead: false, save: jest.fn().mockResolvedValue(true) };
      Notification.findOne.mockResolvedValue(mockNotif);

      await notificationService.markAsRead(5, 42);

      expect(Notification.findOne).toHaveBeenCalledWith({ where: { id: 5, userId: 42 } });
      expect(mockNotif.isRead).toBe(true);
      expect(mockNotif.save).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead — scope', () => {
    it('sadece o kullanıcının okunmamış bildirimlerini günceller', async () => {
      Notification.update.mockResolvedValue([3]);

      await notificationService.markAllAsRead(42);

      expect(Notification.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { userId: 42, isRead: false } }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('userId eksikse AppError(400) fırlatır', async () => {
      await expect(notificationService.getUnreadCount(null)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('sadece isRead=false olanları sayar', async () => {
      Notification.count.mockResolvedValue(7);

      const result = await notificationService.getUnreadCount(42);

      expect(Notification.count).toHaveBeenCalledWith({ where: { userId: 42, isRead: false } });
      expect(result).toBe(7);
    });
  });
});