/*
 * @Description: 中间件<判断是否登录>
 * @Author: gwang
 * @Date: 2020-10-20 16:20:14
 * @LastEditors: gwang
 * @LastEditTime: 2020-11-09 14:52:11
 */
'use strict';
const { NEED_LOGIN } = require('../common/responseCode');
module.exports = () => {
  return async (ctx, next) => {
    const role = ctx.session.currentuser;
    if (!role) {
      ctx.body = ctx.response.ServerResponse.createByErrorCodeMsg(NEED_LOGIN, '角色未登录,请先登录');
      return ctx.body;
    }
    if (ctx.url === '/checkLogin') {
      ctx.body = ctx.response.ServerResponse.createBySuccess();
      return;
    }
    await next();
  };
};
