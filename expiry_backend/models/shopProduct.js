module.exports = (sequelize, DataTypes) => {
  const ShopProduct = sequelize.define('ShopProduct', {
    shopId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    imageUrl: { type: DataTypes.STRING },
    expiryDate: { type: DataTypes.DATE }
  }, {
    tableName: 'shop_products',
    timestamps: true,
    paranoid: true
  });

  ShopProduct.associate = (models) => {
    ShopProduct.belongsTo(models.Shop, { foreignKey: 'shopId' });
    ShopProduct.belongsToMany(models.Package, {
      through: models.PackageProduct,
      foreignKey: 'shopProductId',
      otherKey: 'packageId'
    });
    ShopProduct.hasMany(models.PackageProduct, { foreignKey: 'shopProductId' });
  };

  return ShopProduct;
};