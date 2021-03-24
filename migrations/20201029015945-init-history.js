/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 09:59:45
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-18 15:32:31
 */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, DATE, UUID, UUIDV4 } = Sequelize;
    await queryInterface.createTable('history', {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      candy_id: {
        type: STRING,
        allowNull: false,
        comment: '红包ID',
      },
      beneficiary: {
        type: STRING,
        allowNull: false,
        comment: '红包受益地址',
      },
      amount: {
        type: STRING,
        allowNull: false,
        comment: '分发金额',
      },
      hash: {
        type: STRING,
        allowNull: false,
        comment: '分发哈希',
      },
      created_at: DATE,
      updated_at: DATE,
    }, {
      indexes: [
        {
          using: 'BTREE',
          fields: [
            'candyId',
            {
              order: 'DESC',
            },
          ],
        },
      ],
    });

    await new Sequelize({
      username: 'root',
      password: 'root',
      database: 'red_packet',
      host: '192.168.1.118',
      dialect: 'mysql',
    }).sync();
  },


  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('history');
  },
};
