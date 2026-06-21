module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define("AuditLog", {
    actorId: DataTypes.INTEGER,
    action: DataTypes.STRING,
    entityType: DataTypes.STRING,
    entityId: DataTypes.INTEGER,
    description: DataTypes.STRING,
    metadata: DataTypes.JSON,
    actorSnapshot: DataTypes.JSON,
  }, {
    timestamps: true
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'actorId',
      as: 'actor'
    });
  };

  return AuditLog;
};