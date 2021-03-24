'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, STRING, DATE } = Sequelize;
    await queryInterface.createTable('user', {
      id: {
        type: BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      nickname: {
        type: STRING(64),
        allowNull: false,
        comments: '登录用户名',
      },
      password: {
        type: STRING(64),
        allowNull: false,
        comments: '密码，MD5加密',
      },
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('user');
  },
};
