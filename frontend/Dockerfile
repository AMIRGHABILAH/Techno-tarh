FROM node:20-bookworm as build-stage

WORKDIR /app

# نصب vite به صورت global
RUN npm install -g vite

COPY package*.json ./
RUN npm install --legacy-peer-deps --registry https://registry.npmjs.org/

# نصب صریح rollup برای معماری x64
RUN npm install @rollup/rollup-linux-x64-gnu --registry https://registry.npmjs.org/

COPY . .
RUN npm run build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
