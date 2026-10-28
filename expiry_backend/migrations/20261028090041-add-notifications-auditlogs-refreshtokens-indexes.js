'use strict';

// Sorgu yollarına göre eksik index'ler:
// - refresh_tokens(userId): revokeAllUserTokens (şifre değişimi / sıfırlama) WHERE userId ile
//   güncelliyor; tabloda sadece token index'i vardı, tam tablo taraması oluyordu
// - AuditLogs(createdAt) ve (action, createdAt): auditService.getLogs ORDER BY createdAt DESC
//   (+ opsiyonel action filtresi); tablo her event'te büyüyor, sadece PRIMARY vardı
// - notifications(userId, createdAt): getUserNotifications (userId filtresi + createdAt sıralaması)
// - notifications(userId, isRead): getUnreadCount ve markAllAsRead
//
// Mevcut notifications(userId) index'i bilerek silinmiyor (FK ile ilişkili olabilir);
// yeni bileşik index'ler onu kapsıyor, sonra istenirse kaldırılır.
//
// DİKKAT: 'AuditLogs' tablo adı büyük harfle oluşturulmuş (Linux MySQL case-sensitive).
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('refresh_tokens', ['userId'], {
      name: 'refresh_tokens_userId',
    });
    await queryInterface.addIndex('AuditLogs', ['createdAt'], {
      name: 'auditlogs_createdAt',
    });
    await queryInterface.addIndex('AuditLogs', ['action', 'createdAt'], {
      name: 'auditlogs_action_createdAt',
    });
    await queryInterface.addIndex('notifications', ['userId', 'createdAt'], {
      name: 'notifications_userId_createdAt',
    });
    await queryInterface.addIndex('notifications', ['userId', 'isRead'], {
      name: 'notifications_userId_isRead',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('notifications', 'notifications_userId_isRead');
    await queryInterface.removeIndex('notifications', 'notifications_userId_createdAt');
    await queryInterface.removeIndex('AuditLogs', 'auditlogs_action_createdAt');
    await queryInterface.removeIndex('AuditLogs', 'auditlogs_createdAt');
    await queryInterface.removeIndex('refresh_tokens', 'refresh_tokens_userId');
  },
};