# FROM node:14
FROM docker.maceroc.com/millegrilles_webappbase:1.42.1

ENV MG_CONSIGNATION_HTTP=https://fichiers \
    APP_FOLDER=/usr/src/app \
    NODE_ENV=production \
    PORT=443

EXPOSE 80 443

# Creer repertoire app, copier fichiers
# WORKDIR $APP_FOLDER

COPY . $APP_FOLDER/
RUN npm install --production

CMD [ "npm", "run", "server" ]
