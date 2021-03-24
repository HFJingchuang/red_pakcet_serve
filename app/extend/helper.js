/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 14:32:57
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 11:56:15
 */
'use strict';

const { LOCK_NONCE, NONCE, NONCE_FAIL } = require('../common/redisKey');
const BigNumber = require('bignumber.js');
const isJSON = require('koa-is-json');
const { Transaction } = require('@swtc/transaction');

module.exports = {
  /**
   * 校验创建交易哈希有效性
   * @param hash
   * @param i 重试次数,max:3
   */
  async checkHash(hash, i = 0) {
    let response;
    try {
      response = await this.ctx.curl(this.getNode(), {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        data: {
          method: 'tx',
          params: [
            {
              binary: false,
              transaction: hash,
            },
          ],
        },
      });
    } catch (error) {
      this.ctx.logger.error(`校验创建交易哈希有效性:${error}`);
      if (i < 25) {
        i++;
        return await this.checkHash(hash, i);
      }
    }

    // 服务异常
    if (!response || response.status !== 200) return this.ctx.response.ServerResponse.createByErrorMsg('服务异常，请重试');

    const data = response.data.result;

    // 无效交易
    if (!data.meta) {
      if (i < 25) {
        i++;
        await new Promise(resolve => setTimeout(resolve, 500));
        return await this.checkHash(hash, i);
      }

      return this.ctx.response.ServerResponse.createByErrorMsg('无效交易或交易还未上链');
    }

    // 转账失败
    if (data.meta.TransactionResult !== 'tesSUCCESS') return this.ctx.response.ServerResponse.createByErrorMsg('转账失败，请确认转账成功后创建红包');
    // 收到地址为指定红包地址
    if (data.Destination !== this.config.swt.address) return this.ctx.response.ServerResponse.createByErrorMsg('无效转账，请核转入对地址是否正确');

    if (!isJSON(data.Amount)) data.Amount = new BigNumber(data.Amount).dividedBy(1000000).toString();
    return this.ctx.response.ServerResponse.createBySuccessData({
      Account: data.Account,
      Amount: data.Amount,
      Destination: data.Destination,
      Memos: data.Memos ? data.Memos[0].Memo.MemoData : '',
    });
  },

  /**
   * 校验补偿交易哈希有效性
   *
   * @param hash
   * @param i 重试次数,max:3
   */
  async checkMakeUpHash(hash, i = 0) {
    let response;
    try {
      response = await this.ctx.curl(this.getNode(), {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        data: {
          method: 'tx',
          params: [
            {
              binary: false,
              transaction: hash,
            },
          ],
        },
      });
    } catch (error) {
      this.ctx.logger.error(`校验补偿交易哈希有效性:${error}`);
      if (i < 25) {
        i++;
        return await this.checkMakeUpHash(hash, i);
      }
    }

    // 服务异常
    if (!response || response.status !== 200) return this.ctx.response.ServerResponse.createByErrorMsg('服务异常，请重试');

    const data = response.data.result;

    // 无效交易
    if (!data.meta) {
      if (i < 25) {
        i++;
        await new Promise(resolve => setTimeout(resolve, 500));
        return await this.checkMakeUpHash(hash, i);
      }
      return this.ctx.response.ServerResponse.createByErrorMsg('无效交易或交易还未上链');

    }
    // 转账成功
    if (data.meta.TransactionResult === 'tesSUCCESS') return this.ctx.response.ServerResponse.createByErrorMsg('分发成功的红包，无需补发');
    // 收到地址为指定红包地址
    if (data.Account !== this.config.swt.address) return this.ctx.response.ServerResponse.createByErrorMsg('无效交易，转出地址不正确');

    if (!isJSON(data.Amount)) data.Amount = new BigNumber(data.Amount).dividedBy(1000000).toString();
    return this.ctx.response.ServerResponse.createBySuccessData({
      Amount: data.Amount,
      Destination: data.Destination,
    });

  },

  /**
   * 校验钱包是否激活
   * @param address
   * @param i 重试次数,max:3
   */
  async checkAddress(address, i = 0) {
    try {
      const response = await this._requestAccountInfo(address);
      if (response && response.status === 200 && response.data.result.account_data) return this.ctx.response.ServerResponse.createBySuccess();
      if (i < 10) {
        i++;
        return await this.checkAddress(address, i);
      }
      return this.ctx.response.ServerResponse.createByErrorMsg('钱包未激活');

    } catch (error) {
      this.ctx.logger.error(`校验钱包是否激活:${error}`);
      if (i < 10) {
        i++;
        return await this.checkAddress(address, i);
      }
      return this.ctx.response.ServerResponse.createByErrorMsg('服务异常');
    }
  },

  /**
   * 获取nonce,保存redis
   * @param i 重试次数,max:3
   */
  async getNonce(i = 0) {
    try {
      const response = await this._requestAccountInfo(this.config.swt.address);
      if (response && response.status === 200 && response.data.result.account_data) {
        await this.app.redis.set(NONCE, response.data.result.account_data.Sequence);
      }
    } catch (error) {
      this.ctx.logger.error(`获取nonce,保存redis:${error}`);
      if (i < 10) {
        i++;
        return await this.getNonce(i);
      }
    }
  },

  /**
   * 获取指定钱包的nonce
   * @param address 钱包地址
   * @param i 重试次数,max:3
   * @return nonce
   */
  async getNonceByAddress(address, i = 0) {
    try {
      const response = await this._requestAccountInfo(address);
      if (response && response.status === 200 && response.data.result.account_data) {
        return response.data.result.account_data.Sequence;
      }
    } catch (error) {
      this.ctx.logger.error(`获取指定钱包的nonce:${error}`);
      if (i < 10) {
        i++;
        return await this.getNonce(i);
      }
    }
  },

  /**
   * 获取钱包详情
   * @param address
   */
  async _requestAccountInfo(address) {
    return await this.ctx.curl(this.getNode(), {
      method: 'POST',
      contentType: 'json',
      dataType: 'json',
      data: {
        method: 'account_info',
        params: [
          { account: address },
        ],
      },
    }).catch(e => this.ctx.logger.error(`获取钱包详情:${e}`));
  },

  /**
   * 转账
   * @param payment
   * @param i 重试次数,max:3
   */
  async transfer(payment, i = 0) {
    // const sequence = await this.getSquence();
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // return this.ctx.response.ServerResponse.createBySuccessData(sequence);
    const param = {
      account: this.config.swt.address,
      to: payment.to,
      amount: {
        value: payment.amount,
        currency: payment.currency,
        issuer: payment.issuer,
      },
    };
    param.sequence = await this.getSquence();

    try {
      const tx = Transaction.buildPaymentTx(param);
      const blob = await tx.signPromise(this.config.swt.privatekey, payment.memo || this.config.swt.memo);
      const response = await this.ctx.curl(this.getNode(), {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        data: {
          method: 'submit',
          params: [
            {
              tx_blob: blob,
            },
          ],
        },
      });

      // 转账交易发送成功
      if (response && response.status === 200 && response.data.result) {
        const data = response.data.result;
        if (data.engine_result === 'tesSUCCESS') {
          return this.ctx.response.ServerResponse.createBySuccessData(data.tx_json.hash);
        }
      }
      // 转账交易发送失败
      this.ctx.logger.error(`转账交易发送失败::参数：${JSON.stringify(param)}原因：${JSON.stringify(response)}`);
      // 缓存交易发送异常的nonce
      await this.app.redis.zadd(NONCE_FAIL, param.sequence, param.sequence);
      return this.ctx.response.ServerResponse.createByErrorMsg('转账失败');
    } catch (error) {
      this.ctx.logger.error(`转账:${error}`);
      // 缓存交易发送异常的nonce
      await this.app.redis.zadd(NONCE_FAIL, param.sequence, param.sequence);
      if (i < 10) {
        i++;
        return await this.transfer(payment, i);
      }
      return this.ctx.response.ServerResponse.createByErrorMsg('服务异常，转账失败');
    }
  },

  /**
   * 发送交易
   * @param {String} sign
   */
  async sendRawTransaction(sign) {
    try {
      const response = await this.ctx.curl(this.getNode(), {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        data: {
          method: 'submit',
          params: [
            {
              tx_blob: sign,
            },
          ],
        },
      });

      // 转账交易发送成功
      if (response && response.status === 200 && response.data.result) {
        const data = response.data.result;
        if (data.engine_result === 'tesSUCCESS') {
          return this.ctx.response.ServerResponse.createBySuccessData(data.tx_json.hash);
        }
      }

      // 转账交易发送失败
      this.ctx.logger.error(`转账交易发送失败:${JSON.stringify(response)}`);
      return this.ctx.response.ServerResponse.createByErrorMsg('交易失败');
    } catch (error) {
      this.ctx.logger.error(`发送交易:${error}`);
      return this.ctx.response.ServerResponse.createByErrorMsg('服务异常，交易失败');
    }
  },

  getNode() {
    const index = Math.floor(Math.random() * this.config.swt.node.length);
    return this.app.config.swt.node[index];
  },

  /**
   * 获取当前交易序列
   * 设置redis锁（expire:500ms），设置成功则获取nonce返回，失败则无限回调直至成功。
   */
  async getSquence() {
    const res = await this.app.redis.setnx(LOCK_NONCE, 'l');
    if (res === 1) {
      await this.app.redis.pexpire(LOCK_NONCE, 1000);
      // 优先获取交易发送失败的nonce
      let squence = await this.app.redis.zrange(NONCE_FAIL, 0, 0);
      if (squence.length === 0) {
        squence = await this.app.redis.get(NONCE);
        await this.app.redis.incr(NONCE);
        await this.app.redis.del(LOCK_NONCE);
        return squence;
      }
      squence = squence[0];
      const res = await this.app.redis.zrem(NONCE_FAIL, squence);
      if (res === 1) {
        await this.app.redis.del(LOCK_NONCE);
        return squence;
      }
    }
    return this.getSquence();
  },

};
