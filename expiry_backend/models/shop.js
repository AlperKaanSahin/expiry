module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define('Shop', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    address: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    ratingAverage: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },

    subMerchantType: { type: DataTypes.ENUM('PERSONAL', 'LIMITED_OR_JOINT_STOCK_COMPANY'), allowNull: true },
    iban: { type: DataTypes.STRING, allowNull: true },
    identityNumber: { type: DataTypes.STRING, allowNull: true },
    taxNumber: { type: DataTypes.STRING, allowNull: true },
    taxOffice: { type: DataTypes.STRING, allowNull: true },
    legalCompanyTitle: { type: DataTypes.STRING, allowNull: true },
    subMerchantKey: { type: DataTypes.STRING, allowNull: true },
    subMerchantStatus: { type: DataTypes.ENUM('pending', 'active', 'failed'), allowNull: false, defaultValue: 'pending' },
  }, {
    timestamps: true,
    paranoid: true,
    tableName: 'shops'
  });

  Shop.associate = (models) => {
    Shop.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
  };

  return Shop;
};