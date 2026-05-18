module.exports = (sequelize, DataTypes) => {
  const Package = sequelize.define('Package', {
    shopId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    deliveryStart: { type: DataTypes.DATE, allowNull: true },
    deliveryEnd: { type: DataTypes.DATE, allowNull: true },
    autoPriceDropEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    priceDropAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    priceDropInterval: { type: DataTypes.INTEGER, allowNull: true },
    lastPriceDropAt: { type: DataTypes.DATE, allowNull: true },
    minPriceDropLimit: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null
    },
    isSold: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }

  }, {
    tableName: 'packages',
    timestamps: true
  });

  Package.associate = (models) => {
    Package.belongsTo(models.Shop, { foreignKey: 'shopId' });
    Package.belongsToMany(models.ShopProduct, {
      through: models.PackageProduct,
      foreignKey: 'packageId',
      otherKey: 'shopProductId'
    });
    Package.hasMany(models.PackageProduct, { foreignKey: 'packageId' });
  };

  return Package;
};