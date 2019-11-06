FROM node:10.13-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && npm install pm2 -g && mv node_modules ../
COPY . ./
EXPOSE 3007
CMD ["pm2-runtime","bin/www"]