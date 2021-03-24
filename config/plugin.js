/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 09:42:52
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-01 18:03:59
 */
'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }

  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },

  redis: {
    enable: true,
    package: 'egg-redis',
  },

  validate: {
    enable: true,
    package: 'egg-validate',
  },

  alinode: {
    enable: true,
    package: 'egg-alinode',
  },

  sessionRedis: {
    enable: true,
    package: 'egg-session-redis',
  },

  swaggerdoc: {
    enable: true,
    package: 'egg-swagger-doc',
  },
};
