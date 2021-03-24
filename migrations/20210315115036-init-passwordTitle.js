'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, DATE, UUID, UUIDV4 } = Sequelize;
    await queryInterface.createTable('passwordTitle', {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      address: {
        type: STRING(64),
        allowNull: false,
        comments: '创建人地址',
      },
      title: {
        type: STRING(64),
        allowNull: false,
        comments: '口令标题',
      },
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('passwordTitle');
  },
};