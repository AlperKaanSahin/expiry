module.exports = (sequelize, DataTypes) => {
  const ShopRating = sequelize.define('ShopRating', {
    shopId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'shopratings',
    timestamps: true
  });

  ShopRating.associate = (models) => {
    ShopRating.belongsTo(models.Shop, { foreignKey: 'shopId' });
    ShopRating.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return ShopRating;
};