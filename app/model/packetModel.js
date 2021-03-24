/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 09:49:42
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-01 18:03:10
 */
'use strict';
const { AVG } = require('../common/type');

module.exports = app => {
  const { TINYINT, STRING, UUID, UUIDV4, BOOLEAN } = app.Sequelize;

  const PacketModel = app.model.define('packet', {
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
    coinType: {
      type: STRING,
      allowNull: false,
      comment: '红包币种issuer',
    },
    coinIssuer: {
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
      allowNull: false,
      comment: '红包余额',
    },
    refund: {
      type: STRING,
      allowNull: true,
      comment: '红包退款金额',
    },
    refundHash: {
      type: STRING,
      allowNull: true,
      comment: '退款哈希',
    },
    isRefund: {
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
  });

  return PacketModel;
};
