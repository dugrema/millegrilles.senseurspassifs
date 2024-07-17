Repository pour MilleGrilles - Senseurs Passifs.

# Développement

Installer une millegrille localement et configurer nginx pour rediriger vers les ports du serveur web et react 
de développement.

S'assurer d'avoir expose les ports du middleware (mq, mongo, redis) avec le script **instance**/bin/dev/publish_ports.sh.

## Web

Fichier /var/opt/millegrilles/nginx/modules/senseurspassifs_web.app.location.

- Port web 4013
- Port react 3014

## Paramètres serveur

<pre>
CA_PEM=/var/opt/millegrilles/configuration/pki.millegrille.cert
CERT_PEM=/var/opt/millegrilles/secrets/pki.senseurspassifs_web.cert
KEY_PEM=/var/opt/millegrilles/secrets/pki.senseurspassifs_web.cle
REDIS_PASSWORD_PATH=/var/opt/millegrilles/secrets/passwd.redis.txt
WEB_PORT=4013
MQ_HOSTNAME=localhost
REDIS_HOSTNAME=localhost
</pre>

Pour executer la partie serveur, démarrer millegrilles_instance/__main__.py. 

Utiliser : python3 -m server_senseurspassifs

## Client react

Aller dans le repertoire client/ du projet.

- sudo apt install cmake build-essential
- Installer nvm et nodeJS 20 (e.g. nvm install 20 && nvm use 20)
- Installer react-app-rewired : npm i -g react-app-rewired
- Preparer les dépendances avec : export NODE_OPTIONS=--openssl-legacy-provider && npm i
