FROM nginx:mainline-alpine

WORKDIR /usr/share/nginx/html

COPY . /usr/share/nginx/html

RUN ls /usr/share/nginx/html

ENTRYPOINT /usr/share/nginx/html/docker-entrypoint.sh nginx -g "daemon off;"
