module.exports = (sequelize, DataTypes) => {
  const PackageProduct = sequelize.define('PackageProduct', {
    packageId: { type: DataTypes.INTEGER, allowNull: false },
    shopProductId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER }
  }, {
    tableName: 'package_products',
    timestamps: true
  });

  PackageProduct.associate = (models) => {
    PackageProduct.belongsTo(models.Package, { foreignKey: 'packageId' });
    PackageProduct.belongsTo(models.ShopProduct, { foreignKey: 'shopProductId' });
  };

  return PackageProduct;
};