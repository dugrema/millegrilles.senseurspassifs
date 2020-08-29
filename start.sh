#!/usr/bin/env bash

CERT_FOLDER=/home/mathieu/mgdev/certs
export HOST=`hostname`

# CERT_FOLDER=/opt/millegrilles/$MG_NOM_MILLEGRILLE/pki/deployeur
CERT_FOLDER=/home/mathieu/mgdev/certs

# export COUPDOEIL_SESSION_TIMEOUT=15000
export MG_MQ_CAFILE=$CERT_FOLDER/pki.millegrille.cert
export MG_MQ_CERTFILE=$CERT_FOLDER/pki.web_protege.cert
export MG_MQ_KEYFILE=$CERT_FOLDER/pki.web_protege.key

# export WEB_CERT=~/.acme.sh/mg-dev3.maple.maceroc.com/fullchain.cer
# export WEB_KEY=~/.acme.sh/mg-dev3.maple.maceroc.com/mg-dev3.maple.maceroc.com.key
export WEB_CERT=$MG_MQ_CERTFILE
export WEB_KEY=$MG_MQ_KEYFILE
export MG_MQ_URL=amqps://$HOST:5673
export PORT=3013

export SERVER_TYPE=spdy

export NODE_ENV=development

# Parametre module logging debug
export DEBUG=millegrilles:*
export DEV=1
export IDMG=JPtGcNcFSkfSdw49YsDpQHKxqTHMitpbPZW17a2JC54T

npm start
