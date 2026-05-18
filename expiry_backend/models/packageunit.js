// models/packageunit.js
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
    }
  }, {});
  PackageUnit.associate = function(models) {
    PackageUnit.belongsTo(models.Package, { foreignKey: 'packageId' });
  };
  return PackageUnit;
};