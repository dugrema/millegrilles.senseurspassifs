#!/bin/bash

source image_info.txt
ARCH=`uname -m`

# Override version (e.g. pour utiliser x86_64_...)
# VERSION=x86_64_1.29.3
IMAGE_DOCKER=$REPO/${NAME}:${ARCH}_${VERSION}

echo Image docker : $IMAGE_DOCKER

# MQ
export HOST=`hostname --fqdn`
export HOST_MQ=$HOST

CERT_FOLDER=/home/mathieu/mgdev/certs
export MG_MQ_CAFILE=/configuration/pki.millegrille.cert
export MG_MQ_CERTFILE=/certs/pki.senseurspassifs_web.cert
export MG_MQ_KEYFILE=/certs/pki.senseurspassifs_web.cle
export MG_MQ_URL=amqps://$HOST_MQ:5673
export MG_REDIS_HOST=mg-dev5
export PORT=3013

export DEBUG=www,millegrilles:server6

docker run --rm -it \
  --network host \
  -v /var/opt/millegrilles/secrets:/certs \
  -v /var/opt/millegrilles/configuration:/configuration \
  -e MG_MQ_CAFILE -e MG_MQ_CERTFILE -e MG_MQ_KEYFILE \
  -e MG_MQ_URL -e HOST -e PORT \
  -e MG_REDIS_HOST \
  -e DEBUG \
  $IMAGE_DOCKER
