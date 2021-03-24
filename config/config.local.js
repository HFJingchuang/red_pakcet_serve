/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 09:43:05
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 15:22:25
 */
/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_jch_red_packet';

  // add your middleware config here
  config.middleware = [
    'isLogin',
    'grab',
  ];

  // 中间件'isLogin'
  config.isLogin = {
    match: [ '/checkLogin', ctx => ctx.path.startsWith('/manager') ],
  };
  config.grab = {
    match: [ '/grab' ],
  };

  config.sequelize = {
    dialect: 'mysql',
    host: '192.168.1.118',
    port: 3306,
    database: 'red_packet',
    username: 'root',
    password: 'root',
    timezone: '+08:00', // 东八时区
    define: {
      underscored: true,
      freezeTableName: true,
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: (field, next) => {
        if (field.type === 'DATETIME') {
          return field.string();
        }
        return next();
      },
    },
    pool: {
      max: 100,
      acquire: 100000,
    },
  };

  config.redis = {
    client: {
      host: '192.168.1.118',
      port: '6379',
      password: '',
      db: '0',
    },
    // agent:true
  };

  config.security = {
    csrf: {
      enable: false,
    },
    // 判断是否需要 ignore 的方法，请求上下文 context 作为第一个参数
    // ignore: ctx => {
    //   if (ctx.request.url == '/admin/goods/goodsUploadImage') {
    //     return true;
    //   }
    //   return false;
    // }
  };

  config.alinode = {
    // 从 `Node.js 性能平台` 获取对应的接入参数
    enable: false,
    appid: '86692',
    secret: '81fe9dda6ee1a092c15870a4d211c6fa0cbb31ac',
  };

  config.swt = {
    node: [],
    issuer: '',
    address: '', // 服务红包地址，需指定
    privatekey: '', // 加密后服务红包地址私钥（加密方式参照根目录crypto.js），需指定
    memo: '井创SWTC红包DAPP',
  };

  config.swaggerdoc = {
    dirScanner: './app/controller',
    apiInfo: {
      title: '红包DAPP服务API文档',
      description: '红包DAPP服务API',
      version: '1.0.0',
    },
    consumes: [ 'application/json', 'multipart/form-data' ], // 指定处理请求的提交内容类型（Content-Type），例如application/json, text/html
    produces: [ 'application/json', 'multipart/form-data' ], // 指定返回的内容类型，仅当request请求头中的(Accept)类型中包含该指定类型才返回
    schemes: [ 'http', 'https' ],
    routerMap: true, // 是否自动生成route
    enable: true,
  };

  config.cluster = {
    listen: {
      // path: '',
      // port: 8000,
      // hostname: '192.168.1.118',
    },
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
