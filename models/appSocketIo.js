// Gestion evenements socket.io pour /millegrilles
const debug = require('debug')('millegrilles:senseurspassifs:appSocketIo');

const ROUTING_KEYS_NOEUDS = [
  'evenement.SenseursPassifs.majNoeudConfirmee'
]

const ROUTING_KEYS_SENSEURS = [
  'evenement.SenseursPassifs.lectureConfirmee',
]

function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPublics: [
      {eventName: 'challenge', callback: (params, cb) => {challenge(socket, params, cb)}},
    ],
    listenersPrives: [
    ],
    listenersProteges: [
      {eventName: 'SenseursPassifs/getListeNoeuds', callback: cb => {getListeNoeuds(socket, cb)}},
      {eventName: 'SenseursPassifs/getListeSenseursNoeud', callback: (noeud_id, cb) => {getListeSenseursNoeud(socket, noeud_id, cb)}},
      {eventName: 'SenseursPassifs/changerNomNoeud', callback: (params, cb) => {changerNomNoeud(socket, params, cb)}},
      {eventName: 'SenseursPassifs/changerSecuriteNoeud', callback: (params, cb) => {changerSecuriteNoeud(socket, params, cb)}},
      // {eventName: 'SenseursPassifs/setActiviteBlynk', callback: (params, cb) => {setActiviteBlynk(socket, params, cb)}},
      // {eventName: 'SenseursPassifs/setAuthTokenBlynk', callback: (params, cb) => {setAuthTokenBlynk(socket, params, cb)}},
      // {eventName: 'SenseursPassifs/setServerBlynk', callback: (params, cb) => {setServerBlynk(socket, params, cb)}},
      {eventName: 'SenseursPassifs/setSecuriteSenseur', callback: (params, cb) => {setSecuriteSenseur(socket, params, cb)}},
      {eventName: 'SenseursPassifs/changerNomSenseur', callback: (params, cb) => {changerNomSenseur(socket, params, cb)}},
      {eventName: 'SenseursPassifs/setVpinSenseur', callback: (params, cb) => {setVpinSenseur(socket, params, cb)}},
      {eventName: 'SenseursPassifs/setActiviteLcd', callback: (params, cb) => {setActiviteLcd(socket, params, cb)}},
      {eventName: 'SenseursPassifs/setVpinLcd', callback: (params, cb) => {setVpinLcd(socket, params, cb)}},
      {eventName: 'SenseursPassifs/setAffichageLcd', callback: (params, cb) => {setAffichageLcd(socket, params, cb)}},

      // Listeners
      {eventName: 'SenseursPassifs/ecouterEvenementsSenseurs', callback: (params, cb) => {ecouterEvenementsSenseurs(socket, params, cb)}},
      {eventName: 'SenseursPassifs/retirerEvenementsSenseurs', callback: (params, cb) => {retirerEvenementsSenseurs(socket, params, cb)}},
      {eventName: 'SenseursPassifs/ecouterEvenementsNoeuds', callback: (params, cb) => {ecouterEvenementsNoeuds(socket, params, cb)}},
      {eventName: 'SenseursPassifs/retirerEvenementsNoeuds', callback: (params, cb) => {retirerEvenementsNoeuds(socket, params, cb)}},

    ]
  }

  return configurationEvenements
}

async function challenge(socket, params, cb) {
  // Repondre avec un message signe
  // console.debug("!!! SOCKET ! : %O", socket)
  const reponse = {
    reponse: params.challenge,
    message: 'Trust no one',
    nomUsager: socket.nomUsager,
    userId: socket.userId,
  }
  const reponseSignee = await socket.amqpdao.pki.formatterMessage(reponse, 'challenge', {ajouterCertificat: true})
  cb(reponseSignee)
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

async function getListeSenseursNoeud(socket, requete, cb) {
  try {
    debug("getListeSenseursNoeud:\n%O", requete)
    const dao = socket.senseursPassifsDao
    const noeuds = await dao.getListeSenseursNoeud(requete)
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

// async function setActiviteBlynk(socket, params, cb) {
//   try {
//     const {noeud_id, activite} = params
//     debug("setActiviteBlynk:\n%O", params)
//     const dao = socket.senseursPassifsDao
//     await dao.setActiviteBlynk(noeud_id, activite)
//     if(cb) cb(true)
//   } catch(err) {
//     if(cb) cb({err: "Erreur : " + err})
//   }
// }
//
// async function setAuthTokenBlynk(socket, params, cb) {
//   try {
//     const {noeud_id, authToken} = params
//     debug("setServerBlynk:\n%O", params)
//     const dao = socket.senseursPassifsDao
//     await dao.setAuthTokenBlynk(noeud_id, authToken)
//     if(cb) cb(true)
//   } catch(err) {
//     if(cb) cb({err: "Erreur : " + err})
//   }
// }
//
// async function setServerBlynk(socket, params, cb) {
//   try {
//     const {noeud_id, host, port} = params
//     debug("setServerBlynk:\n%O", params)
//     const dao = socket.senseursPassifsDao
//     await dao.setServerBlynk(noeud_id, host, port)
//     if(cb) cb(true)
//   } catch(err) {
//     if(cb) cb({err: "Erreur : " + err})
//   }
// }

async function setActiviteLcd(socket, params, cb) {
  try {
    const {noeud_id, activite} = params
    debug("setActiviteLcd:\n%O", params)
    const dao = socket.senseursPassifsDao
    await dao.setActiviteLcd(noeud_id, activite)
    if(cb) cb(true)
  } catch(err) {
    if(cb) cb({err: "Erreur : " + err})
  }
}

async function setVpinLcd(socket, params, cb) {
  try {
    const {noeud_id, lcd_vpin_onoff, lcd_vpin_navigation} = params
    debug("setVpinLcd:\n%O", params)
    const dao = socket.senseursPassifsDao
    await dao.setVpinLcd(noeud_id, lcd_vpin_onoff, lcd_vpin_navigation)
    if(cb) cb(true)
  } catch(err) {
    if(cb) cb({err: "Erreur : " + err})
  }
}

async function setAffichageLcd(socket, params, cb) {
  try {
    const {noeud_id, lcd_affichage} = params
    debug("setAffichageLcd:\n%O", params)
    const dao = socket.senseursPassifsDao
    await dao.setAffichageLcd(noeud_id, lcd_affichage)
    if(cb) cb(true)
  } catch(err) {
    if(cb) cb({err: "Erreur : " + err})
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

function ecouterEvenementsSenseurs(socket, params, cb) {
  const opts = {
    routingKeys: ROUTING_KEYS_SENSEURS,
    exchange: ['3.protege'],
  }
  debug("Params : %O, cb: %O", params, cb)
  socket.subscribe(opts, cb)
}

function retirerEvenementsSenseurs(socket, params, cb) {
  const routingKeys = ROUTING_KEYS_SENSEURS.map(item=>'3.protege.'+item)
  socket.unsubscribe({routingKeys})
  debug("retirerEvenementsSenseurs")
  if(cb) cb(true)
}

function ecouterEvenementsNoeuds(socket, params, cb) {
  const opts = {
    routingKeys: ROUTING_KEYS_NOEUDS,
    exchange: ['3.protege'],
  }
  debug("Params : %O, cb: %O", params, cb)
  socket.subscribe(opts, cb)
}

function retirerEvenementsNoeuds(socket, params, cb) {
  const routingKeys = ROUTING_KEYS_NOEUDS.map(item=>'3.protege.'+item)
  socket.unsubscribe({routingKeys})
  debug("retirerEvenementsSenseurs")
  if(cb) cb(true)
}

module.exports = {
  configurerEvenements
}
