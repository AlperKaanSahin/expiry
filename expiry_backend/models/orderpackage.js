'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderPackage extends Model {
    static associate(models) {
      OrderPackage.belongsTo(models.Order, { foreignKey: 'orderId' });
      OrderPackage.belongsTo(models.Package, { foreignKey: 'packageId' });
    }
  }
  OrderPackage.init({
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'OrderPackage',
    tableName: 'orderpackages',
    timestamps: true
  });
  return OrderPackage;
};