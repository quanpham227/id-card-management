# Stage 1: Build React
FROM node:18-alpine as build
WORKDIR /app

# [TỐI ƯU] Copy cả package-lock.json để cài đặt ổn định hơn
COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Build ra thư mục dist
RUN npm run build

# Stage 2: Chạy bằng Nginx
FROM nginx:alpine
# Copy file đã build sang thư mục web của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# [QUAN TRỌNG] Đã xóa dòng COPY ../nginx/default.conf tại đây
# Chúng ta sẽ xử lý nó ở docker-compose.yml

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]