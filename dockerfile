FROM registry.cn-hangzhou.aliyuncs.com/aliyun-node/alinode:v5.16.0-alpine
WORKDIR /home/app
COPY / .
# RUN  npm install --registry=https://registry.npm.taobao.org > /dev/null 2>&1
RUN  npm install --production --registry=https://registry.npm.taobao.org > /dev/null 2>&1
# CMD npm run dev -- --key=${secret}
# CMD ["npm", "run", "dev"]
ENTRYPOINT ["npm", "start", "--"]