<!--
 * @Description: 
 * @Author: gwang
 * @Date: 2020-10-29 09:42:52
 * @LastEditors: gwang
 * @LastEditTime: 2021-03-24 15:22:12
-->
# red_packet

### 红包DAPP服务端，采用EGG框架。支持均分红包、随机红包。以下为TP DAPP浏览器打开链接。

- https://candy.jcdtech.cn/

### 配置更改

#### 更改mysql、redis链接配置,涉及文件如下

- config/config.*.json
- migrations/20201029015945-init-history.js

#### 更改服务钱包配置
- config/config.local.json 本地服务配置
- config/config.defalut.json 生产服务配置
```js
  config.swt = {
    node: [],
    issuer: '',
    address: '', // 服务红包地址，需指定
    privatekey: '', // 加密后服务红包地址私钥（加密方式参照根目录crypto.js），需指定
    memo: '井创SWTC红包DAPP',
  };
```

- config/config.*.json
- migrations/20201029015945-init-history.js

### DB导入
- 本地数据库建立red_packet库后，执行以下命令
```bash
$ npm run up
```

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### Docker部署
```bash
$ docker build -t xx/red_packet:1.0 .

$ docker run -itd -p 7001:7001 --name red_packet --restart always -v /etc/localtime:/etc/localtime:ro -v /etc/timezone:/etc/timezone:ro  -v /xxx/logs:/home/app/logs xx/red_packet:1.0 --key='xxx'
```

### Swagger文档
启动访问URL: http://localhost:7001/swagger-ui.html

### 定时任务
```
app/schedule

nodes.js 每30分钟更新节点地址
refund.js 每天三点处理到期未退款的红包
```

### 中间件
```
app/middleware

isLogin.js 请求登录权限校验，仅过滤后台管理类请求
grab.js 抢红包请求预处理
```

### API

  - [发红包](#发红包)
  - [抢红包](#抢红包)
  - [抢红包历史记录](#抢红包历史记录)
  - [发红包历史记录](#发红包历史记录)
  - [红包详情](#红包详情)
  - [红包总数](#红包总数)
  - [红包补偿](#红包补偿)
  - [已抢红包总额](#已抢红包总额)
  - [已发红包总额](#已发红包总额)
  - [发红包列表](#发红包列表)
  - [剩余红包数量](#剩余红包数量)
  - [登录](#登录)
  - [登出](#登出)
  - [设置红包口令](#设置红包口令)
  - [获取红包口令](#获取红包口令)

#### 发红包

* route

   `/sendTransactionAndCreate`

* method

   `post`

* 请求参数

   参数|类型|必填|可选值 |默认值|描述
   --|:--:|:--:|:--:|:--:|:--
   type|String|是|0:均分红红包 <br> 1:随机红包|0|红包类型
   num|Number|是|1-100|-|红包份数
   hash|String|是|-|-|红包交易哈希

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|Object|查询结果|-|-
     &emsp;&emsp;id|String|红包ID|-|-
     &emsp;&emsp;isRefund|Boolean|是否到期退款|-|-
     &emsp;&emsp;creator|String|红包创建者|-|-
     &emsp;&emsp;hash|String|交易哈希|-|-
     &emsp;&emsp;coinType|String|币种名称|-|-
     &emsp;&emsp;coinIssuer|String|币种issuer|-|-
     &emsp;&emsp;type|String|红包类型|-|-
     &emsp;&emsp;num|Number|总份数|-|-
     &emsp;&emsp;remainder|Number|剩余份数|-|-
     &emsp;&emsp;amount|String|总额|-|-
     &emsp;&emsp;balance|String|余额|-|-
     &emsp;&emsp;remark|String|备注(16进制)|-|-

#### 抢红包

* route

   `/grab`

* method

   `post`

* 请求参数

   参数|类型|必填|可选值 |默认值|描述
   --|:--:|:--:|:--:|:--:|:--
   id|String|是|-|-|红包ID
   address|String|是|-|-|钱包地址
   title|String|是|-|-|口令标题

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|Object|查询结果|-|-
     &emsp;&emsp;candyId|String|红包ID|-|-
     &emsp;&emsp;beneficiary|String|收益地址|-|-
     &emsp;&emsp;amount|String|抢红包金额|-|-
     &emsp;&emsp;hash|String|交易哈希|-|-
     &emsp;&emsp;coinType|String|币种名称|-|-

#### 抢红包历史记录

* route

   `/getHistoryByAddr?address=`

* method

   `get`

* 请求参数

   参数|类型|必填|可选值 |默认值|描述
   --|:--:|:--:|:--:|:--:|:--
   address|String|是|-|-|钱包地址
   pageNum|Number|否|-|1|分页页数
   pageSize|Number|否|-|10|每页数量
   year|String|是|-|-|年份

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|Object|查询结果|-|-
     &emsp;pageNum|String|分页页数|-|-
     &emsp;pageSize|String|每页数量|-|-
     &emsp;total|Number|获取总数|-|-
     &emsp;list|Array|历史记录集合|-|-
     &emsp;&emsp;id|String|抢红包ID|-|-
     &emsp;&emsp;hash|String|抢红包交易哈希|-|-
     &emsp;&emsp;type|Number|红包类型|-|-
     &emsp;&emsp;coin_type|String|币种名称|-|-
     &emsp;&emsp;beneficiary|String|收益地址|-|-
     &emsp;&emsp;amount|String|抢红包金额|-|-
     &emsp;&emsp;updatedAt|String|更新时间|DESC|-
     &emsp;&emsp;`packet.id`|String|红包ID|-|-

#### 发红包历史记录

* route

   `/getPacketByAddr?address=`

* method

   `get`

* 请求参数

   参数|类型|必填|可选值 |默认值|描述
   --|:--:|:--:|:--:|:--:|:--
   address|String|是|-|-|钱包地址
   pageNum|Number|否|-|1|分页页数
   pageSize|Number|否|-|10|每页数量
   year|String|是|-|-|年份

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|Object|查询结果|-|-
     &emsp;pageNum|String|分页页数|-|-
     &emsp;pageSize|String|每页数量|-|-
     &emsp;total|Number|获取总数|-|-
     &emsp;list|Array|历史记录集合|-|-
     &emsp;&emsp;id|String|红包ID|-|-
     &emsp;&emsp;creator|String|红包创建者|-|-
     &emsp;&emsp;hash|String|创建红包交易哈希|-|-
     &emsp;&emsp;type|Number|红包类型|-|-
     &emsp;&emsp;coin_type|String|币种名称|-|-
     &emsp;&emsp;num|Number|红包总份数|-|-
     &emsp;&emsp;amount|String|红包总额|-|-
     &emsp;&emsp;createdAt|String|红包创建时间|-|-

#### 红包详情

* route

   `/getPacketById?id=`

* method

   `get`

* 请求参数

   参数|类型|必填|可选值 |默认值|描述
   --|:--:|:--:|:--:|:--:|:--
   id|String|是|-|-|红包ID
   pageNum|Number|否|-|1|分页页数
   pageSize|Number|否|-|10|每页数量

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|Object|查询结果|-|-
     &emsp;pageNum|String|分页页数|-|-
     &emsp;pageSize|String|每页数量|-|-
     &emsp;total|Number|获取总数|-|-
     &emsp;list|Array|抢红包记录集合|-|-
     &emsp;&emsp;beneficiary|String|红包收益地址|-|-
     &emsp;&emsp;amount|String|所抢金额|-|-
     &emsp;&emsp;hash|String|抢红包交易哈希|-|-
     &emsp;&emsp;updatedAt|String|更新时间|DESC|-
     &emsp;packet|Object|红包详情|-|-
     &emsp;&emsp;id|String|红包ID|-|-
     &emsp;&emsp;coinType|String|币种名称|-|-
     &emsp;&emsp;num|Number|红包总份数|-|-
     &emsp;&emsp;remainder|Number|红包剩余份数|-|-
     &emsp;&emsp;balance|String|红包余额|-|-
     &emsp;&emsp;isRefund|Boolean|是否到期退款|-|-
     &emsp;&emsp;refundHash|String|退款哈希|-|-
     &emsp;&emsp;refund|String|退款金额|-|-
     &emsp;&emsp;amount|String|红包总额|-|-
     &emsp;&emsp;hash|String|红包创建哈希|-|-
     &emsp;&emsp;remark|String|红包备注|-|-
     &emsp;&emsp;type|String|红包类型|-|-

#### 红包总数

* route

   `/getPacketCount`

* method

   `get`

* 请求参数

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|Number|查询结果|-|-

#### 红包补偿

* route

   `/makeUp`

* method

   `post`

* 请求参数

   参数|类型|必填|可选值 |默认值|描述
   --|:--:|:--:|:--:|:--:|:--
   id|String|是|-|-|抢红包ID
   hash|String|是|-|-|交易哈希

* 返回结果

   字段|类型|描述|备注|可能值
   :--|:--:|:--|:--|:--
   status|String|-|"0"表示成功|-
   msg|String|消息描述|-|-
   data|String|交易哈希|-|-

#### 已抢红包总额

* route

  `/getPacketAmount`

* method

  get

* 请求参数

  | 参数    |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | ------- | :----: | :--: | :----: | :----: | :------- |
  | address | String |  是  |   -    |   -    | 钱包地址 |
  | year    | String |  是  |   -    |   -    | 查询年份 |

* 返回结果

  | 字段   |   类型    | 描述     | 备注        | 可能值           |      |
  | :----- | :-------: | :------- | :---------- | :--------------- | ---- |
  | status |  String   | -        | "0"表示成功 | -                |      |
  | msg    |  String   | 消息描述 | -           | -                |      |
  | data   |   List    | 查询结果 | -           | 以币种分类的总额 |      |
  |        | coin_type | 币种     | -           | -                |      |
  |        | amountNum | 总额     | -           | -                |      |

#### 已发红包总额

* route

  `/sendPacketAmount`

* method

  get

* 请求参数

  | 参数    |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | ------- | :----: | :--: | :----: | :----: | :------- |
  | address | String |  是  |   -    |   -    | 钱包地址 |
  | year    | String |  是  |   -    |   -    | 查询年份 |

* 返回结果

  | 字段   |   类型    | 描述     | 备注        | 可能值           |      |
  | :----- | :-------: | :------- | :---------- | :--------------- | ---- |
  | status |  String   | -        | "0"表示成功 | -                |      |
  | msg    |  String   | 消息描述 | -           | -                |      |
  | data   |   List    | 查询结果 | -           | 以币种分类的总额 |      |
  |        | coin_type | 币种     | -           | -                |      |
  |        | amountNum | 总额     | -           | -                |      |

#### 发红包列表

* route

  `/manager/getPacketList`

* method

  get

* 请求参数

  | 参数     |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | -------- | :----: | :--: | :----: | :----: | :------- |
  | pageSize | Number |  否  |   -    |   10   | 每页数据 |
  | pageNum  | Number |  否  |   -    |   1    | 页数     |
  | hash     | String |  否  |   -    |   -    | 交易哈希 |
  | address  | String |  否  |   -    |   -    | 创建地址 |

* 返回结果

  | 字段   |    类型    | 描述         | 备注                    | 可能值   |
  | :----- | :--------: | :----------- | :---------------------- | :------- |
  | status |   String   | -            | "0"表示成功             | -        |
  | msg    |   String   | 消息描述     | -                       | -        |
  | data   |    List    | 查询结果     | -                       | 红包列表 |
  |        |     id     | 红包id       | -                       | -        |
  |        |  creator   | 创建者       | -                       | -        |
  |        |    hash    | 交易哈希     | -                       | -        |
  |        |  coinType  | 币种         | -                       | -        |
  |        | coinIssuer | 注释         | -                       | -        |
  |        |    type    | 红包类型     | 0: 均分红包 1: 运气红包 | -        |
  |        |    num     | 红包数量     | -                       | -        |
  |        | remainder  | 剩余数量     | -                       | -        |
  |        |   amount   | 红包金额     | -                       | -        |
  |        |  balance   | 红包余额     | -                       | -        |
  |        |   refund   | 红包退款金额 | -                       | -        |
  |        | refundHash | 退款哈希     | -                       | -        |
  |        |  isRefund  | 是否退款     | 0: 退款 1: 未退款       | -        |
  |        |   remark   | 备注         | -                       | -        |
  |        |   title    | 口令标题     | -                       | -        |
  |        | createdAt  | 创建时间     | -                       | -        |
  |        | updatedAt  | 修改时间     | -                       | -        |

#### 剩余红包数量

* route

  `/getPacketRemainderCount`

* method

  get

* 请求参数

  | 参数 | 类型 | 必填 | 可选值 | 默认值 | 描述 |
  | ---- | :--: | :--: | :----: | :----: | :--: |
  | -    |  -   |  -   |   -    |   -    |  -   |

* 返回结果

  | 字段   |  类型  | 描述     | 备注        | 可能值       |
  | :----- | :----: | :------- | :---------- | :----------- |
  | status | String | -        | "0"表示成功 | -            |
  | msg    | String | 消息描述 | -           | -            |
  | data   | Number | 查询结果 | -           | 未领取红包数 |

#### 登录

* route

  /login

* method

  get

* 请求参数

  | 参数     |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | -------- | :----: | :--: | :----: | :----: | :------- |
  | nickname | String |  是  |   -    |   -    | 用户名   |
  | password | String |  是  |   -    |   -    | 登陆密码 |

* 返回结果

  | 字段   |   类型   | 描述     | 备注        | 可能值         |
  | :----- | :------: | :------- | :---------- | :------------- |
  | status |  String  | -        | "0"表示成功 | -              |
  | msg    |  String  | 消息描述 | -           | -              |
  | data   |  Object  | 查询结果 | -           | 登录用户的对象 |
  |        |    id    | 用户id   | -           | -              |
  |        | nickname | 用户名   | -           | -              |

#### 登出

* route

  `/logout

* method

  get

* 请求参数

  | 参数 | 类型 | 必填 | 可选值 | 默认值 | 描述 |
  | ---- | :--: | :--: | :----: | :----: | :--- |
  | -    |  -   |  -   |   -    |   -    | -    |

* 返回结果

  | 字段   |  类型  | 描述     | 备注        | 可能值 |
  | :----- | :----: | :------- | :---------- | :----- |
  | status | String | -        | "0"表示成功 | -      |
  | msg    | String | 消息描述 | -           | -      |
  | data   |  null  | -        | -           | -      |

#### 设置红包口令

* route

  `/setPasswordTitle`

* method

  post

* 请求参数

  | 参数    |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | ------- | :----: | :--: | :----: | :----: | :------- |
  | address | String |  是  |   -    |   -    | 钱包地址 |
  | sign    | String |  是  |   -    |   -    | 签名     |
  | title   | String |  是  |   -    |   -    | 口令标题 |

* 返回结果

  | 字段   |   类型    | 描述     | 备注        | 可能值           |
  | :----- | :-------: | :------- | :---------- | :--------------- |
  | status |  String   | -        | "0"表示成功 | -                |
  | msg    |  String   | 消息描述 | -           | -                |
  | data   |  Object   | 设置记录 | -           | 一条口令标题记录 |
  |        |    id     | 红包id   | -           | -                |
  |        |  address  | 钱包地址 | -           | -                |
  |        |   title   | 口令标题 | -           | -                |
  |        | createdAt | 创建时间 | -           | -                |
  |        | updatedAt | 修改时间 | -           | -                |

#### 获取红包口令

* route

  `/getPasswordTitle`

* method

  get

* 请求参数

  | 参数    |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | ------- | :----: | :--: | :----: | :----: | :------- |
  | address | String |  是  |   -    |   -    | 钱包地址 |

* 返回结果

  | 字段   |   类型    | 描述     | 备注        | 可能值           |
  | :----- | :-------: | :------- | :---------- | :--------------- |
  | status |  String   | -        | "0"表示成功 | -                |
  | msg    |  String   | 消息描述 | -           | -                |
  | data   |  Object   | 查询结果 | -           | 获取口令标题记录 |
  |        |    id     | 红包id   | -           | -                |
  |        |  address  | 钱包地址 | -           | -                |
  |        |   title   | 口令标题 | -           | -                |
  |        | createdAt | 创建时间 | -           | -                |
  |        | updatedAt | 修改时间 | -           | -                |

#### 获取Nonce

* route

  `/getNonce`

* method

  get

* 请求参数

  | 参数    |  类型  | 必填 | 可选值 | 默认值 | 描述     |
  | ------- | :----: | :--: | :----: | :----: | :------- |
  | address | String |  是  |   -    |   -    | 钱包地址 |

* 返回结果

  | 字段   |  类型  | 描述     | 备注        | 可能值 |
  | :----- | :----: | :------- | :---------- | :----- |
  | status | String | -        | "0"表示成功 | -      |
  | msg    | String | 消息描述 | -           | -      |
  | data   | nonce  | 查询结果 | -           | -      |


#### SWTC&MOAC开发者社区

项目讨论的QQ群：568285439

Telegram: https://t.me/moacblockchain

提案发起（Submit proposal）： https://github.com/JCCDex/ProjectFundingProposal/issues