const { sequelize, DataTypes } = require("sequelize");
function initUserDocumentAccess(sequelize) {
  const UserDocumentAccess = sequelize.define(
    "UserDocumentAccess",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      documentId: {
        type: DataTypes.UUID,
        references: {
          model: "documents",
          key: "id",
        },
      },
    },
    {
      underscored: true,
      tableName: "user_document_access",
    }
  );
  return UserDocumentAccess;
}
module.exports = initUserDocumentAccess;