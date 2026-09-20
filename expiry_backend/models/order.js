'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'userId' });
      Order.belongsTo(models.Shop, { foreignKey: 'shopId' });
      Order.hasMany(models.OrderPackage, { foreignKey: 'orderId' });
    }
  }

  Order.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    deliveryToken: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // 🔥 ESCROW STATE
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },

    // ⚠️ Bunlar changeStatusInternal'da set ediliyordu ama modelde tanımlı
    // değillerdi — Sequelize tanımsız property'lere yapılan atamayı "dirty"
    // işaretlemediği için save() bunları hiçbir zaman DB'ye yazmıyordu.
    // DB'de kolon olarak var mı doğrula (DESCRIBE orders) — yoksa ayrı bir
    // migration gerekir.
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    releasedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Iyzico checkout akışı için eklendi
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    paidPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    checkoutToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }

  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true
  });

  return Order;
};