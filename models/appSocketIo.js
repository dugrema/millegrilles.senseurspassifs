// Gestion evenements socket.io pour /millegrilles
const debug = require('debug')('millegrilles:senseurspassifs:appSocketIo');

const routingKeysPrive = [
  'transaction.SenseursPassifs.#.majNoeud',
  'transaction.SenseursPassifs.#.majSenseur',
  'evenement.SenseursPassifs.#.lecture',
  'appSocketio.nodejs',  // Juste pour trouver facilement sur exchange - debug
]

// Enregistre les evenements prive sur le socket
async function enregistrerPrive(socket, amqpdao) {
  debug("Enregistrer evenements prives sur socket %s", socket.id)
  socket.on('disconnect', ()=>{
    deconnexion(socket)
  })

  // Operation niveau prive
  socket.on('getListeNoeuds', cb => {getListeNoeuds(socket, cb)})
  socket.on('getListeSenseursNoeud', (noeud_id, cb) => {getListeSenseursNoeud(socket, noeud_id, cb)})
  socket.on('changerNomNoeud', (params, cb) => {changerNomNoeud(socket, params, cb)})
  socket.on('changerSecuriteNoeud', (params, cb) => {changerSecuriteNoeud(socket, params, cb)})
  socket.on('setAuthTokenBlynk', (params, cb) => {setAuthTokenBlynk(socket, params, cb)})
  socket.on('setServerBlynk', (params, cb) => {setServerBlynk(socket, params, cb)})
  socket.on('setSecuriteSenseur', (params, cb) => {setSecuriteSenseur(socket, params, cb)})
  socket.on('changerNomSenseur', (params, cb) => {changerNomSenseur(socket, params, cb)})
  socket.on('setVpinSenseur', (params, cb) => {setVpinSenseur(socket, params, cb)})

  socket.on('subscribe', params=>{subscribe(socket, params)})
  socket.on('unsubscribe', params=>{subscribe(socket, params)})

  // Ajouter join pour les idmg actifs de l'usager
  // socket.idmgsActifs.forEach( idmg => {
  //   debug("Joindre room du IDMG actif %s", idmg)
  //   socket.join(idmg)
  // })

}

// Enregistre les evenements proteges sur le socket du proprietaire
function enregistrerEvenementsProteges(socket, opts) {
  debug("Enregistrer evenements proteges")
  if(!opts) opts = {}

  socket.listenersProteges = []
  function ajouterListenerProtege(listenerName, cb) {
    socket.listenersProteges.push(listenerName)
    socket.on(listenerName, cb)
  }

  //ajouterListenerProtege('listener...', ()=>{})

  if(opts.estProprietaire) {
    // Listeners proprietaire
    //ajouterListenerProtege('listener...', ()=>{})
  }

}

function deconnexion(socket) {
  console.debug("Deconnexion socket id:%s", socket.id)
}

function subscribe(socket, params) {
  const routingKeys = params.routingKeys
  const exchange = params.exchange || '2.prive'
  return socket.senseursPassifsDao.subscribe(socket, routingKeys, exchange)
}

// function unsubscribe(socket, params) {
//   const routingKeys = params.routingKeys
//   const exchange = params.exchange || '2.prive'
//   const dao = socket.senseursPassifsDao.unsubscribe(socket, routingKeys, exchange)
// }

async function getListeNoeuds(socket, cb) {
  const dao = socket.senseursPassifsDao
  try {
    const noeuds = await dao.getListeNoeuds()
    cb(noeuds)
  } catch(err) {
    debug("Erreur getListeNoeuds\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getListeSenseursNoeud(socket, noeud_id, cb) {
  debug("getListeSenseursNoeud:\n%s", noeud_id)
  const dao = socket.senseursPassifsDao
  try {
    const noeuds = await dao.getListeSenseursNoeud(noeud_id)
    cb(noeuds)
  } catch(err) {
    debug("Erreur getListeSenseursNoeuds\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function changerNomNoeud(socket, params, cb) {
  const {noeud_id, nom} = params
  debug("changerNomNoeud:\n%O", params)
  const dao = socket.senseursPassifsDao
  try {
    await dao.changerNomNoeud(noeud_id, nom)
    cb(true)
  } catch(err) {
    debug("Erreur changerNomNoeud\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function changerSecuriteNoeud(socket, params, cb) {
  const {noeud_id, securite} = params
  debug("changerSecuriteNoeud:\n%O", params)
  const dao = socket.senseursPassifsDao
  try {
    const noeuds = await dao.changerSecuriteNoeud(noeud_id, securite)
    cb(noeuds)
  } catch(err) {
    debug("Erreur changerSecuriteNoeud\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function setAuthTokenBlynk(socket, params, cb) {
  try {
    const {noeud_id, authToken} = params
    debug("setServerBlynk:\n%O", params)
    const dao = socket.senseursPassifsDao
    dao.setAuthTokenBlynk(noeud_id, authToken)
    cb(true)
  } catch(err) {
    cb({err: "Erreur : " + err})
  }
}

async function setServerBlynk(socket, params, cb) {
  try {
    const {noeud_id, host, port} = params
    debug("setServerBlynk:\n%O", params)
    const dao = socket.senseursPassifsDao
    dao.setServerBlynk(noeud_id, host, port)
    cb(true)
  } catch(err) {
    cb({err: "Erreur : " + err})
  }
}

async function setSecuriteSenseur(socket, params, cb) {

}

async function changerNomSenseur(socket, params, cb) {
  const {uuid_senseur, nom} = params
  debug("changerNomSenseur:\n%O", params)
  const dao = socket.senseursPassifsDao
  try {
    await dao.changerNomSenseur(uuid_senseur, nom)
    cb(true)
  } catch(err) {
    debug("Erreur changerNomSenseur\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function setVpinSenseur(socket, params, cb) {
  try {
    const {uuid_senseur, blynkVPins} = params
    debug("setVpinSenseur:\n%O", params)
    const dao = socket.senseursPassifsDao
    await dao.setVpinSenseur(uuid_senseur, blynkVPins)
    cb(true)
  } catch(err) {
    console.error("Erreur set vpin: %O", err)
    cb({err: "Erreur : " + err.message?err.message:err})
  }
}


// function recevoirNouveauMessageAMQ(socket, routingKey, message) {
//   debug("Message AMQ recu, routingKey : ", routingKey)
//   debug(message)
// }

// async function getMessagesUsagerParSource(socket, idmgsSource, cb) {
//
//   const listeMessages = await socket.messagerieDao.getMessagesUsagerParSource(
//     socket.nomUsager, socket.idmgsActifs, idmgsSource)
//
//   debug("Liste messages")
//   debug(listeMessages)
//   cb(listeMessages)
//
// }

function downgradePrive(socket, params) {
  debug("Downgrade connexion vers mode prive")

  const listenersProteges = socket.listenersProteges

  listenersProteges.forEach(listenerName => {
    debug("Retrait listener %s", listenerName)
    socket.removeAllListeners(listenerName)
  })

  // Cleanup socket
  delete socket.listenersProteges

  socket.emit('modeProtege', {'etat': false})
}

// function transmettreNouveauMessage(message, amqpdao) {
//   // debug("Nouveau message emis, transmettre via MQ")
//   // debug(message)
//
//   const domaineAction = 'Messagerie.envoyerMessage'
//   const transaction = {
//     securite: message.securite,
//     idmg_source: message.idmg_source,
//     idmg_destination: message.idmg_destination,
//     message: message.message,
//   }
//
//   amqpdao.transmettreTransactionFormattee(transaction, domaineAction)
// }


// async function getSommaireMessages(socket, cb) {
//
//   const listeMessages = await socket.messagerieDao.getSommaireMessages(
//     socket.nomUsager, socket.idmgsActifs)
//
//   debug("Sommaire messages par idmg")
//   debug(listeMessages)
//   cb(listeMessages)
//
// }

module.exports = {
  enregistrerPrive,
  downgradePrive,
  enregistrerEvenementsProteges,
}
