module.exports = (sequelize, DataTypes) => {
  const PackageUnit = sequelize.define('PackageUnit', {
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isSold: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Sipariş oluşturma anında (createOrder) rezerve edilir. TTL süresi
    // geçince ayrı bir cron olmadan, bir sonraki createOrder çağrısı bu
    // birimi otomatik olarak müsait sayar ("lazy release" — bkz.
    // orderService.createOrder / reserveStock).
    reservedByOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reservedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {});
  PackageUnit.associate = function(models) {
    PackageUnit.belongsTo(models.Package, { foreignKey: 'packageId' });
    PackageUnit.belongsTo(models.Order, { foreignKey: 'reservedByOrderId', as: 'reservedByOrder' });
  };
  return PackageUnit;
};