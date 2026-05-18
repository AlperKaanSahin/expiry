module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define('Shop', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    address: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ratingAverage: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 } 
  }, {
    timestamps: true,
    paranoid: true,
    tableName: 'shops',
  });

  Shop.associate = (models) => {
    Shop.belongsTo(models.User, { foreignKey: 'ownerId' });
    Shop.hasMany(models.ShopProduct, { foreignKey: 'shopId' });
    Shop.hasMany(models.Package, { foreignKey: 'shopId' });
    Shop.hasMany(models.ShopRating, { foreignKey: 'shopId' });
  };

  return Shop;
};