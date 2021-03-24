/*
 * @Description: 每隔半小时重新获取节点
 * @Author: gwang
 * @Date: 2020-11-02 10:19:32
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 11:58:23
 */
'use strict';
const { NONCE } = require('../common/redisKey');
const Subscription = require('egg').Subscription;

class Nodes extends Subscription {
  // eslint-disable-next-line no-useless-constructor
  constructor(ctx) {
    super(ctx);
  }
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '30m',
      type: 'all',
      immediate: true,
      // disable: true,
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const response = await this.ctx.curl('https://gateway.swtc.top/rpcservice?' + Date.now(), {
      dataType: 'json',
    });
    // 服务异常
    if (!response || response.status !== 200 || !response.data) return;
    const newNodes = [];
    for (const node of response.data.rpcpeers) {
      const res = await this.ctx.curl(node, {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        timeout: 100, // 过滤响应时间过长的节点
        data: {
          method: 'account_info',
          params: [
            { account: 'jZ3Upe4Be53xVVoRqyiXqCkrXBMfegDP9' },
          ],
        },
      }).catch(e => console.log(e));
      if (res && res.status === 200 && res.data.result.account_data) {
        newNodes.push(node);
      }
    }
    if (newNodes.length > 0) {
      this.app.config.swt.node = newNodes;
      console.log(this.app.config.swt.node);
      const squence = await this.app.redis.get(NONCE);
      if (squence) {
        await this.ctx.helper.getNonce();// 缓存nonce
      }
    }
  }
}

module.exports = Nodes;
