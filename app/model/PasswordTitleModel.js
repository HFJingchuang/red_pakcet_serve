'use strict';
module.exports = app => {
  const { STRING, UUID, UUIDV4 } = app.Sequelize;

  const PasswordTitleModel = app.model.define('passwordTitle', {
    id: {
      type: UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    address: {
      type: STRING,
      allowNull: false,
      comment: '创建人地址',
    },
    title: {
      type: STRING,
      allowNull: false,
      comment: '红包口令',
    },
  });

  return PasswordTitleModel;
};