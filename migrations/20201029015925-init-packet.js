/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 09:59:25
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-18 15:29:42
 */
'use strict';
const { AVG } = require('../app/common/type');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, DATE, UUID, UUIDV4, BOOLEAN, TINYINT } = Sequelize;
    await queryInterface.createTable('packet', {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      creator: {
        type: STRING,
        allowNull: false,
        comment: '红包创建者',
      },
      hash: {
        type: STRING,
        allowNull: false,
        comment: '创建哈希',
      },
      coin_type: {
        type: STRING,
        allowNull: false,
        comment: '红包币种issuer',
      },
      coin_issuer: {
        type: STRING,
        allowNull: false,
        comment: '红包币种issuer',
      },
      type: {
        type: TINYINT,
        allowNull: false,
        defaultValue: AVG,
        comment: '红包类型',
      },
      num: {
        type: TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '红包份数',
      },
      remainder: {
        type: TINYINT,
        allowNull: false,
        comment: '红包剩余份数',
      },
      amount: {
        type: STRING,
        allowNull: false,
        comment: '红包金额',
      },
      balance: {
        type: STRING,
        allowNull: true,
        comment: '红包余额',
      },
      refund: {
        type: STRING,
        allowNull: true,
        comment: '红包退款金额',
      },
      refund_hash: {
        type: STRING,
        allowNull: true,
        comment: '退款哈希',
      },
      is_refund: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否退款',
      },
      remark: {
        type: STRING,
        allowNull: true,
        comment: '备注',
      },
      title: {
        type: STRING,
        allowNull: true,
        comment: '口令标题',
      },
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('packet');
  },
};
