'use strict';

module.exports = {
  create: {
    type: { type: 'string', required: true, description: '红包类型' },
    num: { type: 'integer', required: true, description: '红包数量' },
    hash: { type: 'string', required: true, description: '交易签名' },
  },
  grab: {
    id: { type: 'string', required: true, description: '红包id' },
    address: { type: 'string', required: true, description: '钱包地址' },
    title: { type: 'string', required: true, description: '红包标题' },
  },
  makeUp: {
    id: { type: 'string', required: true, description: '红包id' },
    hash: { type: 'string', required: true, description: '交易哈希' },
  },
  setPasswordTitle: {
    address: { type: 'string', required: true, description: '钱包地址' },
    title: { type: 'string', required: true, description: '红包标题' },
    sign: { type: 'string', required: true, description: '交易签名' },
  },
};
