#!/usr/bin/env node

import debugLib from 'debug'
import app from '../app.js'

const debug = debugLib('www')
debug("Demarrer server6")

// Initialiser le serveur
app()
    .catch(err=>{
        console.error("serveur6.www Erreur execution app : %O", err)
    })
    .finally(()=>{
        debug("Fin initialisation serveur5.www")
    })


// const debug = require('debug')('millegrilles:senseurspassifs:www')
// const express = require('express')

// const socketApp = require('../models/appSocketIo')
// // const {initialiser: initialiserServer} = require('@dugrema/millegrilles.common/lib/server3')
// const server4 = require('@dugrema/millegrilles.common/lib/server4')
// const { extraireExtensionsMillegrille } = require('@dugrema/millegrilles.common/lib/forgecommon')
// const {initialiser: initialiserSenseursPassifs} = require('../routes/senseurspassifs')
// const { SenseursPassifsDao } = require('../models/senseursPassifsDao')

// async function init() {

//   // Initialiser server et routes
//   const app = express()
//   const {server, socketIo, amqpdao: amqpdaoInst} = await server4(
//     app, socketApp.configurerEvenements, {pathApp: '/senseurspassifs', verifierAutorisation})

//   const senseursPassifsDao = new SenseursPassifsDao(amqpdaoInst)
//   socketIo.use((socket, next)=>{
//     socket.senseursPassifsDao = senseursPassifsDao
//     next()
//   })

//   const routeSenseursPassifs = express.Router()
//   app.use('/senseurspassifs', routeSenseursPassifs)

//   // Inserer les routes apres l'initialisation, permet d'avoir le middleware
//   // attache avant (app.use comme le logging morgan, injection amqpdao, etc.)
//   routeSenseursPassifs.use((req, res, next)=>{
//     req.senseursPassifsDao = senseursPassifsDao
//     next()
//   })

//   routeSenseursPassifs.use(initialiserSenseursPassifs(amqpdaoInst))
//   routeSenseursPassifs.use(express.static('static/'))

// }

// function verifierAutorisation(socket, securite, certificatForge) {
//   debug("Verifier autorisation cert %O", certificatForge)
//   if(securite === '3.protege') {
//     const extensions = extraireExtensionsMillegrille(certificatForge)
//     debug("www.verifierAutorisation extensions %O", extensions)

//     // Deleguation globale donne tous les acces
//     if(['proprietaire', 'delegue'].includes(extensions.delegationGlobale)) {
//       debug("Usager proprietaire, acces 3.protege OK")
//       return true
//     }

//     // Delegation au domaine coupdoeil
//     if(extensions.delegationsDomaines.includes('coupdoeil')) {
//       debug("Usager delegue domaine coupdoeil, acces 3.protege OK")
//       return true
//     }

//     debug("Usager acces 3.protege refuse")
//   }
//   return false
// }

// init()
