/*
 * @Description:
 * @Author: gwang
 * @Date: 2020-10-30 12:14:38
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 14:55:31
 */
'use strict';
const CryptoJS = require('crypto-js');

const key = '58f368'; // 加密key 启动命令参数

const en = encode('private key');
console.log('加密：' + en);
const de = decode(en);
console.log('解密：' + de);

function encode(msg) {
  return CryptoJS.AES.encrypt(msg, key).toString();
}

function decode(msg) {
  return CryptoJS.AES.decrypt(msg, key).toString(CryptoJS.enc.Utf8);
}
