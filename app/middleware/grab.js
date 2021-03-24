/*
 * @Description: 中间件<抢红包请求预处理>
 * @Author: gwang
 * @Date: 2020-10-20 16:20:14
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-22 10:51:27
 */
'use strict';
const { PRE_OVER } = require('../common/redisKey');
const { OVER } = require('../common/responseCode');
module.exports = (options, app) => {
  return async (ctx, next) => {
    // 获取redis缓存
    const { id } = ctx.request.body;
    const res = await app.redis.get(`${PRE_OVER}${id}`);
    if (res === '0') {
      ctx.body = ctx.response.ServerResponse.createByErrorCodeMsg(OVER, '红包已抢完');
      return;
    }

    await next();
  };
};
