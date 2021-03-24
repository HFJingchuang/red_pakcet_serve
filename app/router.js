/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-29 09:42:52
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 10:58:25
 */
'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.post('/sendTransactionAndCreate', controller.packetController.sendTransactionAndCreate);
  router.post('/grab', controller.packetController.grab);
  router.post('/makeUp', controller.packetController.makeUp);
  router.get('/getHistoryByAddr', controller.packetController.getHistoryByAddr);
  router.get('/getPacketByAddr', controller.packetController.getPacketByAddr);
  router.post('/setPasswordTitle', controller.packetController.setPasswordTitle);
  router.get('/getPasswordTitle', controller.packetController.getPasswordTitle);
  router.get('/getPacketById', controller.packetController.getPacketById);
  router.get('/getPacketCount', controller.packetController.getPacketCount);
  router.get('/manager/getPacketList', controller.packetController.getPacketList);
  router.get('/manager/getPacketRemainderCount', controller.packetController.getPacketRemainderCount);
  router.get('/sendPacketAmount', controller.packetController.sendPacketAmount);
  router.get('/getPacketAmount', controller.packetController.getPacketAmount);
  router.get('/login', controller.packetController.login);
  router.post('/checkLogin', {});
  router.get('/logout', controller.packetController.logout);
  app.router.redirect('/', '/swagger-ui.html', 302);
  router.get('/getNonce', controller.packetController.getNonce);
};
