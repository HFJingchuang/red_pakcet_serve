/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 10:50:31
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-01 18:02:58
 */
'use strict';

module.exports = app => {
  const { STRING, UUID, UUIDV4 } = app.Sequelize;

  const HistoryModel = app.model.define('history', {
    id: {
      type: UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    candyId: {
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

  HistoryModel.associate = function() {
    app.model.HistoryModel.belongsTo(app.model.PacketModel, { foreignKey: 'candyId', targetKey: 'id' });
  };

  return HistoryModel;
};
