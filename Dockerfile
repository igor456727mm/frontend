FROM nginx:mainline-alpine

WORKDIR /usr/share/nginx/html

COPY . /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT [ "/usr/share/nginx/html/docker-entrypoint.sh" ]

CMD nginx -g "daemon off;"
