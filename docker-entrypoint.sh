#!/bin/sh

if [[ $API_DOMAIN ]]
then
sed -i -e "s/<head>/<head><script>__API_DOMAIN='${API_DOMAIN}';<\/script>/g" /usr/share/nginx/html/index.html
fi

if [[ $API_SCHEME ]]
then
API_SCHEME="$(echo "$API_SCHEME" | sed 's/[:\/&]/\\&/g')" && sed -i -e "s/<head>/<head><script>__API_SCHEME='${API_SCHEME}';<\/script>/g" /usr/share/nginx/html/index.html
fi

exec "$@"
