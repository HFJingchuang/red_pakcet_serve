'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('user', [{ id: 0,
      nickname: 'admin', password: '21232f297a57a5a743894a0e4a801fc3', created_at: new Date(), updated_at: new Date() }], []);
  },
};
