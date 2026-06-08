module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define("AuditLog", {
    actorId: DataTypes.INTEGER,
    action: DataTypes.STRING,
    entityType: DataTypes.STRING,
    entityId: DataTypes.INTEGER,
    description: DataTypes.STRING,
    metadata: DataTypes.JSON
  }, {
    timestamps: true
  });

  return AuditLog;
};