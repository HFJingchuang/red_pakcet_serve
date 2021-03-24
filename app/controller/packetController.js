/*
 * @Description: 【创建红包】、【抢红包】、【补偿红包】、【根据地址获取抢红包记录】、【根据地址获取抢红包记录】、【获取抢红包详情】、【获取红包总数】
 * @Author: gwang
 * @Date: 2020-10-29 09:52:21
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 10:51:37
 */
'use strict';

const Controller = require('egg').Controller;

/**
 * @Controller 红包
 */
class PacketController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.session = ctx.session;
    this.RPService = ctx.service.packetService;
    this.ServerResponse = ctx.response.ServerResponse;
  }
  /**
      * @summary 创建红包
      * @description 后端发送交易验证通过创建红包
      * @router post /sendTransactionAndCreate
      * @request body create *
      * @response 200 packetResponse
      */
  async sendTransactionAndCreate() {
    const { type, num, sign } = this.ctx.request.body;
    this.ctx.body = await this.RPService.sendTransactionAndCreate(type, num, sign);
  }

  /**
      * @summary 抢红包
      * @description 抢红包
      * @router post /grab
      * @request body grab * 抢红包
      * @response 200 packetResponse
      */
  async grab() {
    const { id, address, title } = this.ctx.request.body;
    this.ctx.body = await this.RPService.grab(id, address, title);
  }

  /**
      * @summary 补偿红包
      * @description 补偿红包
      * @router post /makeUp
      * @request query makeUp *  补偿红包
      * @response 200 packetResponse
      */
  async makeUp() {
    const { id, hash } = this.ctx.request.body;
    this.ctx.body = await this.RPService.makeUp(id, hash);
  }

  /**
      * @summary 根据地址获取抢红包记录
      * @description 根据地址获取抢红包记录
      * @router get /getHistoryByAddr
      * @request query integer pageNum  当前页码
      * @request query string *address 红包地址
      * @request query string *year 年份
      * @response 200 packetResponse
      */
  async getHistoryByAddr() {
    const { pageNum } = this.ctx.query.pageNum;
    this.ctx.body = await this.RPService.getHistoryByAddr(this.ctx.query, pageNum);
  }

  /**
      * @summary 根据地址获取发红包记录
      * @description 根据地址获取发红包记录
      * @router get /getPacketByAddr
      * @request query integer pageNum 当前页码
      * @request query string *address 红包地址
      * @request query string *year 年份
      * @response 200 packetResponse
      */
  async getPacketByAddr() {
    const { pageNum } = this.ctx.query.pageNum;
    this.ctx.body = await this.RPService.getPacketByAddr(this.ctx.query, pageNum);
  }

  /**
      * @summary 获取抢红包详情
      * @description 获取抢红包详情
      * @router get /getPacketById
      * @request query integer pageNum 当前页码
      * @request query string *id 红包ID
      * @response 200 packetResponse
      */
  async getPacketById() {
    const { pageNum } = this.ctx.query.pageNum;
    this.ctx.body = await this.RPService.getPacketById(this.ctx.query, pageNum);
  }

  /**
      * @summary 根据地址获取发送红包总额
      * @description 根据地址获取发送红包总额
      * @router get /sendPacketAmount
      * @request query string *address 红包地址
      * @request query string *year 年份
      * @response 200 packetResponse
      */
  async sendPacketAmount() {
    this.ctx.body = await this.RPService.sendPacketAmount(this.ctx.query);
  }

  /**
      * @summary 根据地址获取领取红包总额
      * @description 根据地址获取领取红包总额
      * @router get /getPacketAmount
      * @request query string *address 红包地址
      * @request query string *year 年份
      * @response 200 packetResponse
      */
  async getPacketAmount() {
    this.ctx.body = await this.RPService.getPacketAmount(this.ctx.query);
  }


  /**
      * @summary 获取红包总数
      * @description 获取红包总数
      * @router get /getPacketCount
      * @response 200 packetResponse
      */
  async getPacketCount() {
    this.ctx.body = await this.RPService.getPacketCount();
  }
  /**
      * @summary 获取红包列表
      * @description 获取红包列表
      * @router get /manager/getPacketList
      * @request query string hash 交易哈希
      * @request query string address 创建地址
      * @response 200 packetResponse
      */
  async getPacketList() {
    this.ctx.body = await this.RPService.getPacketList(this.ctx.query);
  }
  /**
      * @summary 获取剩余红包数量
      * @description 获取剩余红包数量
      * @router get /manager/getPacketRemainderCount
      * @response 200 packetResponse
      */
  async getPacketRemainderCount() {
    this.ctx.body = await this.RPService.getPacketRemainderCount();
  }
  /**
      * @summary  登录
      * @description  登录
      * @router get /login
      * @request query string *nickname 用户名
      * @request query string *password 密码
      * @response 200 packetResponse
      */
  async login() {
    const response = await this.RPService.login(this.ctx.query);
    if (response.isSuccess()) {
      // 校验密码成功将数据保存在redis中
      this.session.currentuser = response.data.id;
    }
    this.ctx.body = response;
  }
  /**
      * @summary  登出
      * @description  登出
      * @router get /logout
      * @response 200 packetResponse
      */
  async logout() {
    const key = this.ctx.cookies.get('EGG_SESS', this.ctx.sessionOptions);
    await this.app.redis.del(key);
    this.ctx.body = this.ServerResponse.createBySuccess();
  }

  /**
      * @summary 设置红包口令
      * @description 设置红包口令
      * @router post /setPasswordTitle
      * @request body setPasswordTitle *  设置红包口令
      * @response 200 packetResponse
      */
  async setPasswordTitle() {
    const { sign, address, title } = this.ctx.request.body;
    this.ctx.body = await this.RPService.setPasswordTitle(sign, address, title);
  }

  /**
      * @summary 获取红包口令
      * @description 获取红包口令
      * @router get /getPasswordTitle
      * @request query string *address 钱包地址
      * @response 200 packetResponse
      */
  async getPasswordTitle() {
    this.ctx.body = await this.RPService.getPasswordTitle();
  }

  /**
      * @summary 获取nonce
      * @description 获取nonce
      * @router get /getNonce
      * @request query string *address 钱包地址
      * @response 200 packetResponse
      */
  async getNonce() {
    this.ctx.body = await this.RPService.getNonce();
  }

}

module.exports = PacketController;

