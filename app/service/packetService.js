/* eslint-disable jsdoc/check-param-names */
/* eslint-disable jsdoc/require-param */
/*
 * @Description: 【创建红包】、【抢红包】、【补偿红包】、【根据地址获取抢红包记录】、【根据地址获取抢红包记录】、【获取抢红包详情】、【获取红包总数】
 * @Author: gwang
 * @Date: 2020-10-29 09:55:08
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 10:57:59
 */

'use strict';
const { AVG, RANDOM } = require('../common/type');
const { PRE_OVER } = require('../common/redisKey');
const { salt } = require('../common/properties');
const Service = require('egg').Service;
const Sequelize = require('sequelize');
const BigNumber = require('bignumber.js');
const md5 = require('md5');

const createRule = {
  type: {
    type: 'enum',
    values: [ AVG, RANDOM ],
    required: true,
  },
  num: {
    type: 'int',
    min: 1,
    max: 100,
    required: true,
  },
  sign: {
    type: 'string',
    required: true,
  },
};

const grabRule = {
  address: {
    type: 'string',
    required: true,
  },
  id: {
    type: 'string',
    required: true,
  },
  title: {
    type: 'string',
    required: true,
  },
};

const amountRule = {
  address: {
    type: 'string',
    required: true,
  },
  year: {
    type: 'string',
    required: true,
  },
};

const historyRule = {
  address: {
    type: 'string',
    required: true,
  },
};

const packetRule = {
  id: {
    type: 'string',
    required: true,
  },
  year: {
    type: 'string',
    required: false,
  },
};
const passwordTitleRule = {
  title: {
    type: 'string',
    required: true,
  },
  address: {
    type: 'string',
    required: true,
  },
  sign: {
    type: 'string',
    required: true,
  },
};

class PacketService extends Service {
  constructor(ctx) {
    super(ctx);
    this.PacketModel = ctx.model.PacketModel;
    this.HistoryModel = ctx.model.HistoryModel;
    this.UserModel = ctx.model.UserModel;
    this.PasswordTitleModel = ctx.model.PasswordTitleModel;
    this.ResponseCode = ctx.response.ResponseCode;
    this.ServerResponse = ctx.response.ServerResponse;
  }

  /**
   * 创建红包
   * @param {*} type 红包类型
   * @param {*} num 红包份数
   * @param {*} signRes  签名返回数据
   */
  async sendTransactionAndCreate(type, num, sign) {
    try {
      // 参数校验
      this.ctx.validate(createRule);

      // 发送交易
      const signRes = await this.ctx.helper.sendRawTransaction(sign);
      if (!signRes.isSuccess()) return signRes;
      const hash = signRes.getData();

      // 存在校验
      // let response = await this._checkPacket(hash);
      // if (!response.isSuccess()) return response;

      // 交易有效性校验
      const response = await this.ctx.helper.checkHash(hash);
      if (!response.isSuccess()) return response;

      const data = response.getData();
      // 判断口令标题有没有设置
      const passwordTitle = await this.PasswordTitleModel.findOne({
        where: {
          address: data.Account,
        },
      });
      let title;
      if (passwordTitle) {
        title = passwordTitle.title;
      } else {
        title = this.config.swt.memo;
      }
      let packet = {
        creator: data.Account,
        hash,
        coinType: data.Amount.currency || 'SWT',
        coinIssuer: data.Amount.issuer || '',
        type,
        num,
        remainder: num,
        amount: data.Amount.value || data.Amount,
        balance: data.Amount.value || data.Amount,
        remark: data.Memos,
        title,
      };
      packet = await this.PacketModel.create(packet);
      if (!packet) return this.ServerResponse.createByErrorMsg('红包创建失败');
      packet = packet.toJSON();
      delete packet.createdAt;
      delete packet.updatedAt;
      return this.ServerResponse.createBySuccessMsgAndData('红包创建成功', packet);
    } catch (error) {
      this.ctx.logger.error(`创建红包:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('红包创建失败');
    }
  }

  /**
   * 抢红包
   * @param {*} id 红包ID
   * @param {*} address 抢红包者地址
   * @param {*} nonce 交易序号
   */
  async grab(id, address, title) {
    let transaction;
    try {
      // 参数校验
      this.ctx.validate(grabRule);

      // 红包存在性校验
      let response = await this._checkPacketTitle(id, title);
      if (!response.isSuccess()) return response;

      // 记录存在校验
      response = await this._checkHistory(id, address);
      if (!response.isSuccess()) return response;

      // 地址激活校验
      response = await this.ctx.helper.checkAddress(address);
      if (!response.isSuccess()) return response;

      transaction = await this.ctx.model.transaction();
      let row = await this.PacketModel.findOne({
        attributes: [ 'coinType', 'coinIssuer', 'type', 'num', 'remainder', 'amount', 'balance' ],
        where: { id, isRefund: false },
        lock: true,
        transaction,
      });

      if (!row) {
        await transaction.rollback();
        return this.ServerResponse.createByErrorMsg('无效红包');
      }

      // 判断是否抢完
      if (row.remainder === 0) {
        await transaction.rollback();
        // 缓存已抢完红包id，期限一个星期60*60*24*7
        await this.app.redis.set(PRE_OVER + id, '0', 'EX', 604800);
        return this.ServerResponse.createByErrorCodeMsg(this.ResponseCode.OVER, '红包已抢完');
      }

      let candyNum;
      // 均分红包
      if (row.type === AVG) {
        candyNum = new BigNumber(row.amount).dividedBy(row.num).toNumber();
      } else {
        // 剩余最后一份红包，全发
        if (row.remainder === 1) {
          candyNum = row.balance;
        } else {
          const rate = Math.random().toFixed(2);
          // let min = new BigNumber(row.amount).times(0.001);
          const min = new BigNumber(0.01);
          const minSum = min.times(row.remainder);
          const max = (new BigNumber(row.balance).minus(minSum)).dividedBy(row.remainder)
            .times(2);
          candyNum = new BigNumber(max).multipliedBy(rate).plus(min)
            .toFixed(2);
        }
      }

      if (new BigNumber(candyNum).comparedTo(new BigNumber(row.balance)) > 0) {
        await transaction.rollback();
        // 缓存已抢完红包id，期限一个星期60*60*24*7
        await this.app.redis.set(`${PRE_OVER}${id}`, '0', 'EX', 604800);
        return this.ServerResponse.createByErrorCodeMsg(this.ResponseCode.OVER, '红包已抢完');
      }

      row.remainder--;
      row.balance = new BigNumber(row.balance).minus(new BigNumber(candyNum)).toString();

      const payment = {
        to: address,
        amount: candyNum,
        currency: row.coinType,
        issuer: row.coinIssuer,
        memo: row.remark,
      };
      response = await this.ctx.helper.transfer(payment);
      if (!response.isSuccess()) {
        await transaction.rollback();
        return response;
      }

      const history = {
        candyId: id,
        beneficiary: address,
        amount: candyNum,
        hash: response.getData(),
      };

      // 更新红包
      row = await this.PacketModel.update({
        remainder: row.remainder,
        balance: row.balance,
      }, {
        where: { id }, transaction,
      });
      if (!row) {
        await transaction.rollback();
        return this.ServerResponse.createByErrorMsg('抢红包失败');
      }

      // 保存历史记录
      row = await this.HistoryModel.create(history, { transaction });
      if (!row) {
        await transaction.rollback();
        return this.ServerResponse.createByErrorMsg('抢红包失败');
      }
      transaction.commit();
      history.coinType = payment.currency;
      return this.ServerResponse.createBySuccessMsgAndData('抢红包成功', history);
    } catch (error) {
      this.ctx.logger.error(`抢红包:${error}`);
      if (transaction) await transaction.rollback();
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('抢红包失败');
    }
  }

  /**
   * 分发失败，重发补偿
   * @param {*} id 红包ID
   */
  async makeUp(id) {
    try {
      // 参数校验
      this.ctx.validate({
        id: {
          type: 'string',
          required: true,
        },
      });

      // 存在校验
      let row = await this.HistoryModel.findOne({
        attributes: [ 'hash' ],
        where: { id },
      });
      if (!row) return this.ServerResponse.createByErrorMsg('无效的红包');

      // 交易有效性校验
      let response = await this.ctx.helper.checkMakeUpHash(row.hash);
      if (!response.isSuccess()) return response;
      const data = response.getData();

      const payment = {
        to: data.Destination,
        amount: data.Amount.value || data.Amount,
        currency: data.Amount.currency || 'SWT',
        issuer: data.Amount.issuer || '',
        memo: `${this.config.swt.memo}:${row.hash}`,
      };
      response = await this.ctx.helper.transfer(payment);
      if (!response.isSuccess()) return response;

      // 更新红包
      row = await this.HistoryModel.update({
        hash: response.getData(),
      }, {
        where: { id },
      });
      if (!row) return this.ServerResponse.createByErrorMsg('补偿失败');

      return this.ServerResponse.createBySuccessMsgAndData('补偿成功', response.getData());
    } catch (error) {
      this.ctx.logger.error(`分发失败，重发补偿:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('补偿失败');
    }
  }

  /**
   * 获取抢红包历史记录
   * @param {Number} pageNum
   * @param {Number} pageSize
   */
  async getHistoryByAddr({ pageNum = 1, pageSize = 20 }) {
    try {
      // 参数校验
      this.ctx.validate(historyRule, this.ctx.request.query);

      const condition = {};
      if (this.ctx.request.query.currency) condition.coinType = this.ctx.request.query.currency;

      const { count, rows } = await this.HistoryModel.findAndCountAll(
        {
          attributes: [ 'id', Sequelize.col('packet.hash'), Sequelize.col('packet.type'), Sequelize.col('packet.coin_type'), 'beneficiary', 'amount', 'hash', 'updatedAt' ],
          include: [{ model: this.PacketModel, as: 'packet', attributes: [ 'id' ], where: condition }],
          raw: true,
          where: {
            [Sequelize.Op.and]: [
              { beneficiary: this.ctx.request.query.address },
              Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('history.created_at')), this.ctx.request.query.year),
            ],
          },
          offset: Number(pageNum - 1 || 0) * Number(pageSize || 0),
          limit: Number(pageSize || 0),
          order: [[ 'updatedAt', 'DESC' ]],
        });
      if (rows) {
        return this.ServerResponse.createBySuccessMsgAndData('抢红包历史记录获取成功', {
          pageNum,
          pageSize,
          list: rows,
          total: count,
        });
      }
      return this.ServerResponse.createByErrorMsg('抢红包历史记录获取失败');

    } catch (error) {
      this.ctx.logger.error(`获取抢红包历史记录:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('抢红包历史记录获取失败');
    }
  }

  /**
   * 获取发红包历史记录
   * @param {*} pageNum
   * @param {*} pageSize
   */
  async getPacketByAddr({ pageNum = 1, pageSize = 20 }) {
    try {
      // 参数校验
      this.ctx.validate(historyRule, this.ctx.request.query);

      const condition = {};
      if (this.ctx.request.query.currency) condition.coinType = this.ctx.request.query.currency;

      const { count, rows } = await this.PacketModel.findAndCountAll(
        {
          attributes: [ 'id', 'creator', 'hash', 'type', 'coin_type', 'num', 'amount', 'createdAt', 'title' ],
          where: {
            [Sequelize.Op.and]: [
              { creator: this.ctx.request.query.address },
              Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('created_at')), this.ctx.request.query.year),
            ],
          },
          offset: Number(pageNum - 1 || 0) * Number(pageSize || 0),
          limit: Number(pageSize || 0),
          order: [[ 'createdAt', 'DESC' ]],
        });
      if (rows) {
        return this.ServerResponse.createBySuccessMsgAndData('发红包历史记录获取成功', {
          pageNum,
          pageSize,
          list: rows,
          total: count,
        });
      }
      return this.ServerResponse.createByErrorMsg('发红包历史记录获取失败');

    } catch (error) {
      this.ctx.logger.error(`获取发红包历史记录:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('发红包历史记录获取失败');
    }
  }

  /**
   * 获取红包详情
   * @param {*} pageNum
   * @param {*} pageSize
   */
  async getPacketById({ pageNum = 1, pageSize = 20 }) {
    try {
      // 参数校验
      this.ctx.validate(packetRule, this.ctx.request.query);
      const condition = {};
      condition.candyId = this.ctx.request.query.id;
      if (this.ctx.request.query.hash) {
        condition.hash = this.ctx.request.query.hash;
      } if (this.ctx.request.query.beneficiary) {
        condition.beneficiary = this.ctx.request.query.beneficiary;
      }
      const packet = await this.PacketModel.findOne(
        {
          attributes: [ 'id', 'creator', 'coinType', 'type', 'num', 'remainder', 'balance', 'isRefund', 'refundHash', 'refund', 'amount', 'hash', 'remark' ],
          where: { id: this.ctx.request.query.id },
        });

      const { count, rows } = await this.HistoryModel.findAndCountAll(
        {
          attributes: [ 'beneficiary', 'amount', 'hash', 'updatedAt' ],
          where: condition,
          offset: Number(pageNum - 1 || 0) * Number(pageSize || 0),
          limit: Number(pageSize || 0),
          order: [[ 'updatedAt', 'DESC' ]],
        });
      if (rows) {
        return this.ServerResponse.createBySuccessMsgAndData('红包详情获取成功', {
          pageNum,
          pageSize,
          packet,
          list: rows,
          total: count,
        });
      }
      return this.ServerResponse.createByErrorMsg('红包详情获取失败');

    } catch (error) {
      this.ctx.logger.error(`获取红包详情:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('红包详情获取失败');
    }
  }

  /**
     * 获取发红包总数记录
     */
  async getPacketCount() {
    try {
      const count = await this.PacketModel.count();
      if (isNaN(count)) return this.ServerResponse.createByErrorMsg('红包总数获取失败');
      return this.ServerResponse.createBySuccessMsgAndData('红包总数获取成功', count);
    } catch (error) {
      this.ctx.logger.error(`获取发红包总数记录:${error}`);
      if (error.code === 'invalid_param') return this.ServerResponse.createByErrorMsg(error.errors[0]);
      return this.ServerResponse.createByErrorMsg('红包总数获取失败');
    }
  }

  /**
   * 根据地址获取发送红包总额
   * @return
   */
  async sendPacketAmount() {
    // 参数校验
    this.ctx.validate(amountRule, this.ctx.request.query);
    try {
      const result = await this.PacketModel.findAll({
        attributes: [
          'coin_type',
          [ Sequelize.fn('sum', Sequelize.col('amount')), 'amountNum' ],
        ],
        where: {
          [Sequelize.Op.and]: [
            { creator: this.ctx.request.query.address },
            Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('created_at')), this.ctx.request.query.year),
          ],
        },

        group: 'coin_type',
      });
      if (!result) return this.ServerResponse.createByErrorMsg('发送红包总额获取失败');
      return this.ServerResponse.createBySuccessMsgAndData('发送红包总额获取成功', result);
    } catch (error) {
      this.ctx.logger.error(`根据地址获取发送红包总额:${error}`);
      if (error.code === 'invalid_param') return this.ServerResponse.createByErrorMsg(error.errors[0]);
      return this.ServerResponse.createByErrorMsg('发送红包总额获取失败');
    }
  }

  /**
   * 根据地址获取领取红包总额
   * @return
   */
  async getPacketAmount() {
    // 参数校验
    this.ctx.validate(amountRule, this.ctx.request.query);
    try {
      const result = await this.HistoryModel.findAll({
        attributes: [
          [ Sequelize.fn('sum', Sequelize.col('history.amount')), 'amountNum' ],
        ],
        include: [{ model: this.PacketModel, as: 'packet', attributes: [ 'coin_type' ], require: false }],
        where: {
          [Sequelize.Op.and]: [
            { beneficiary: this.ctx.request.query.address },
            Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('history.created_at')), this.ctx.request.query.year),
          ],
        },
        group: 'packet.coin_type',
        raw: true,
      });
      if (!result) return this.ServerResponse.createByErrorMsg('领取红包总额获取失败');
      return this.ServerResponse.createBySuccessMsgAndData('领取红包总额获取成功', result);
    } catch (error) {
      this.ctx.logger.error(`根据地址获取领取红包总额:${error}`);
      if (error.code === 'invalid_param') return this.ServerResponse.createByErrorMsg(error.errors[0]);
      return this.ServerResponse.createByErrorMsg('领取红包总额获取失败');
    }
  }

  /**
     * 获取剩余红包总数记录
     */
  async getPacketRemainderCount() {
    try {
      const count = await this.PacketModel.count({
        where: {
          remainder: {
            [Sequelize.Op.gt]: 0,
          },
          isRefund: 0,
        },
      });
      if (isNaN(count)) return this.ServerResponse.createByErrorMsg('剩余红包总数获取失败');
      return this.ServerResponse.createBySuccessMsgAndData('剩余红包总数获取成功', count);
    } catch (error) {
      this.ctx.logger.error(`获取剩余红包总数记录:${error}`);
      if (error.code === 'invalid_param') return this.ServerResponse.createByErrorMsg(error.errors[0]);
      return this.ServerResponse.createByErrorMsg('红包剩余总数获取失败');
    }
  }

  /**
   * 获取红包的列表
   */
  async getPacketList({ pageNum = 1, pageSize = 100 }) {
    // 将查询参数进行封装
    const condition = {};
    if (this.ctx.query.hash) {
      condition.hash = this.ctx.query.hash;
    } if (this.ctx.query.address) {
      condition.creator = this.ctx.query.address;
    }
    try {
      const { count, rows } = await this.PacketModel.findAndCountAll({
        where: condition,
        offset: Number(pageNum - 1 || 0) * Number(pageSize || 0),
        limit: Number(pageSize || 0),
        order: [[ 'createdAt', 'DESC' ]],
      });
      if (rows) {
        return this.ServerResponse.createBySuccessMsgAndData('红包列表获取成功', {
          list: rows,
          pageNum,
          pageSize,
          total: count,
        });
      }
      return this.ServerResponse.createByErrorMsg('红包列表获取失败');
    } catch (error) {
      this.ctx.logger.error(`获取红包的列表:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('红包列表获取失败');
    }
  }

  /**
   * 校验哈希是否已创建
   * @param {String} hash 红包HASH
   */
  async _checkPacket(hash = '') {
    const row = await this.PacketModel.findOne({
      attributes: [ 'id' ],
      where: { hash },
    });
    if (row) {
      return this.ServerResponse.createByErrorMsg('红包已创建');
    }
    return this.ServerResponse.createBySuccess();

  }

  /**
   * 校验红包是否存在
   * @param {String} id 红包ID
   * @param {String} title 口令标题
   */
  async _checkPacketTitle(id = '', title = '') {
    const count = await this.PacketModel.count({
      attributes: [ 'id' ],
      where: { id, title },
    });
    if (isNaN(count) || count === 0) {
      return this.ServerResponse.createByErrorCodeMsg(this.ResponseCode.DONE, '无效红包口令');
    }
    return this.ServerResponse.createBySuccess();
  }

  /**
   * 校验地址是否抢过红包
   * @param {String} id 红包ID
   * @param {String} address 抢红包者地址
   */
  async _checkHistory(id = '', address = '') {
    const row = await this.HistoryModel.findOne({
      attributes: [ 'id' ],
      where: { candyId: id, beneficiary: address },
    });
    if (row) {
      return this.ServerResponse.createByErrorCodeMsg(this.ResponseCode.DONE, '已抢过该红包');
    }
    return this.ServerResponse.createBySuccess();
  }

  /**
     * 登录
     */
  async login() {
    try {
      let result = await this.UserModel.findOne({
        where: {
          nickname: this.ctx.query.nickname,
          password: md5(this.ctx.query.password, salt),
        },
      });
      if (!result) return this.ServerResponse.createByErrorMsg('用户名或者密码错误');
      result = result.toJSON();
      delete result.password;
      delete result.updatedAt;
      delete result.createdAt;
      return this.ServerResponse.createBySuccessMsgAndData('登录成功', result);
    } catch (error) {
      this.ctx.logger.error(`登录:${error}`);
      if (error.code === 'invalid_param') return this.ServerResponse.createByErrorMsg(error.errors[0]);
      return this.ServerResponse.createByErrorMsg('用户名或者密码错误');
    }
  }

  /**
   * 获取当前红包口令
   */
  async getPasswordTitle() {
    // 校验参数
    this.ctx.validate(historyRule, this.ctx.query);

    // 根据地址查询
    try {
      const result = await this.PasswordTitleModel.findOne({
        where: {
          address: this.ctx.query.address,
        },
      });
      if (!result) return this.ServerResponse.createByErrorMsg('未设置专属红包口令标题');
      return this.ServerResponse.createBySuccessMsgAndData('口令标题查询成功', result);
    } catch (error) {
      this.ctx.logger.error(`获取当前红包口令:${error}`);
      if (error.code === 'invalid_param') return this.ServerResponse.createByErrorMsg(error.errors[0]);
      return this.ServerResponse.createByErrorMsg('未设置专属红包口令标题');
    }

  }
  /**
     * 设置红包口令
     */
  async setPasswordTitle(sign, address, title) {
    try {
      // 验证参
      this.ctx.validate(passwordTitleRule);
      // 发送交易
      const signRes = await this.ctx.helper.sendRawTransaction(sign);
      if (!signRes.isSuccess()) return signRes;
      const hash = signRes.getData();

      // 交易有效性校验
      const response = await this.ctx.helper.checkHash(hash);
      if (!response.isSuccess()) return response;

      // 交易有效写入数据库
      let passwordTitle = {
        address,
        title,
      };
      const oldPasswordTitle = await this.PasswordTitleModel.findOne({
        where: {
          address,
        },
      });
      // 判断是新增记录还是修改标题
      if (oldPasswordTitle) {
        passwordTitle = await this.PasswordTitleModel.update({ title }, { where: { address } });
      } else {
        passwordTitle = await this.PasswordTitleModel.create(passwordTitle);
      }
      if (!passwordTitle) return this.ServerResponse.createByErrorMsg('口令标题设置失败');
      return this.ServerResponse.createBySuccessMsgAndData('口令标题设置成功', passwordTitle);
    } catch (error) {
      this.ctx.logger.error(`设置红包口令:${error}`);
      if (error.code === 'invalid_param') {
        return this.ServerResponse.createByErrorMsg(error.errors[0]);
      }
      return this.ServerResponse.createByErrorMsg('口令标题设置失败');
    }

  }

  /**
   * 获取指定钱包Nonce
   */
  async getNonce() {
    // 校验参数
    this.ctx.validate(historyRule, this.ctx.query);

    // 根据地址查询
    const nonce = await this.ctx.helper.getNonceByAddress(this.ctx.query.address);
    if (isNaN(nonce)) return this.ServerResponse.createByErrorMsg('交易序列获取失败，请重试');
    return this.ServerResponse.createBySuccessMsgAndData('交易序列获取成功', nonce);
  }
}

module.exports = PacketService;
