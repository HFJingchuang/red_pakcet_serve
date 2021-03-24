'use strict';
module.exports = app => {
  const { STRING, BIGINT } = app.Sequelize;

  const UserModel = app.model.define('user', {
    id: {
      type: BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    nickname: {
      type: STRING,
      allowNull: false,
      comment: '登录用户名',
    },
    password: {
      type: STRING,
      allowNull: false,
      comment: '登陆密码',
    },
  });

  return UserModel;
};
