/*
 * @Description: 24小时到期退款（失败不处理,下次继续）
 * @Author: gwang
 * @Date: 2020-11-02 10:19:32
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-18 11:35:41
 */
'use strict';
const Subscription = require('egg').Subscription;
const { Op } = require('sequelize');

class Refund extends Subscription {
  constructor(ctx) {
    super(ctx);
    this.PacketModel = ctx.model.PacketModel;
  }
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      cron: '0 0 3 * * *', // 每天三点执行一次
      type: 'worker',
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const rows = await this.PacketModel.findAll({
      attributes: [ 'id', 'creator', 'balance', 'coinType', 'coinIssuer' ],
      where: {
        balance: {
          [Op.ne]: '0',
        },
        createdAt: {
          [Op.lte]: new Date(new Date() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!rows || rows.length === 0) return;
    for (let i = 0, length = rows.length; i < length; i++) {
      const row = rows[i];
      const payment = {
        to: row.creator,
        amount: row.balance,
        currency: row.coinType,
        issuer: row.coinIssuer,
        memo: '【井创红包DAPP】红包到期退款',
      };
      const response = await this.ctx.helper.transfer(payment);
      if (response.isSuccess()) {
        const res = await this.PacketModel.update({
          balance: '0',
          remainder: 0,
          isRefund: true,
          refund: row.balance,
          refundHash: response.getData(),
        }, {
          where: {
            id: row.id,
          },
        });
        if (!res) this.ctx.logger.error(`退款更新失败:${row.id}`);
      } else {
        this.ctx.logger.error(`退款交易失败:${row.id}`);
      }
    }
  }
}

module.exports = Refund;
