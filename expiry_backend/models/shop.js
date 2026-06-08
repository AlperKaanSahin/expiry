module.exports = (sequelize, DataTypes) => {
const Shop = sequelize.define('Shop', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  address: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  ownerId: { type: DataTypes.INTEGER, allowNull: false },

  ratingAverage: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },

  ratingCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  }

}, {
  timestamps: true,
  paranoid: true,
  tableName: 'shops'
});

  return Shop;
};