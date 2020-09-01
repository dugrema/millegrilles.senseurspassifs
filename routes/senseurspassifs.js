const debug = require('debug')('millegrilles:senseurspassifs:route');
const express = require('express')

const { configurationEvenements } = require('../models/appSocketIo')
const { SenseursPassifsDao } = require('../models/senseursPassifsDao')

function initialiser(fctRabbitMQParIdmg, opts) {
  if(!opts) opts = {}
  const idmg = opts.idmg
  const amqpdao = fctRabbitMQParIdmg(idmg)

  const senseursPassifsDao = new SenseursPassifsDao(amqpdao)

  debug("IDMG: %s, AMQPDAO : %s", idmg, amqpdao !== undefined)

  const route = express()
  route.get('/info.json', routeInfo)
  ajouterStaticRoute(route)

  debug("Route /senseurspassifs de SenseursPassifs est initialisee")

  function middleware(socket, next) {
    debug("Middleware senseurspassifs socket.io, injection senseursPassifsDao")
    socket.senseursPassifsDao = senseursPassifsDao
    next()
  }

  const socketio = {middleware, configurationEvenements}

  // Retourner dictionnaire avec route pour server.js
  return {route, socketio}

}

function ajouterStaticRoute(route) {
  // Route utilisee pour transmettre fichiers react de la messagerie en production
  var folderStatic =
    process.env.MG_SENSEURSPASSIFS_STATIC_RES ||
    process.env.MG_STATIC_RES ||
    'static/senseurspassifs'

  route.use(express.static(folderStatic))
  debug("Route %s pour senseurspassifs initialisee", folderStatic)
}

function routeInfo(req, res, next) {
  debug(req.headers)
  const idmgCompte = req.headers['idmg-compte']
  const nomUsager = req.headers['user-prive']
  // const idmgsActifs = req.headers['idmgs-actifs'].split(',')
  const host = req.headers.host

  // const reponse = {idmgCompte, nomUsager, idmgsActifs, hostname: host}
  const reponse = {idmgCompte, nomUsager, hostname: host}
  return res.send(reponse)
}

module.exports = {initialiser}
