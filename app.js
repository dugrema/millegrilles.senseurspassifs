import debugLib from 'debug'
import express from 'express'

import { server5 } from '@dugrema/millegrilles.nodejs'
import utiljs from '@dugrema/millegrilles.utiljs'

import { configurerEvenements } from './appSocketIo.js'
import routeCollections from './routes/senseurspassifs.js'
import * as mqdao from './mqdao.js'

const debug = debugLib('app')
const { extraireExtensionsMillegrille } = utiljs.forgecommon

export default async function app(params) {
    debug("Server app params %O", params)
    const app = express()
    const {server, socketIo, amqpdao: amqpdaoInst} = await server5(
        app,
        configurerEvenements,
        {pathApp: '/senseurspassifs', verifierAutorisation, exchange: '3.protege'}
    )

    socketIo.use((socket, next)=>{
      socket.mqdao = mqdao
      next()
    })

    // Inserer les routes apres l'initialisation, permet d'avoir le middleware
    // attache avant (app.use comme le logging morgan, injection amqpdao, etc.)
    const route = express.Router()
    app.use('/senseurspassifs', route)
    route.use((req, res, next)=>{
      req.mqdao = mqdao
      next()
    })
    route.use(routeCollections(amqpdaoInst))

    return server
}

function verifierAutorisation(socket, securite, certificatForge) {

    let prive = false, protege = false

    const extensions = extraireExtensionsMillegrille(certificatForge)
    // console.debug("!!! www.verifierAutorisation extensions %O", extensions)

    if(['proprietaire', 'delegue'].includes(extensions.delegationGlobale)) {
        // Deleguation globale donne tous les acces
        debug("Usager proprietaire, acces 3.protege OK")
        prive = true
        protege = true
    } else if(extensions.delegationsDomaines.includes('collections')) {
        // Delegation au domaine coupdoeil
        debug("Usager delegue domaine collections, acces 3.protege OK")
        prive = true
        protege = true
    } 
    // else if(securite === '2.prive') {
    //     const roles = extensions.roles || []
    //     if(roles.includes('compte_prive')) {
    //         debug("Usager prive, acces 2.prive OK")
    //         prive = true
    //     }
    // }
   
    return {prive, protege}
}

