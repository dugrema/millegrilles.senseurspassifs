// Gestion evenements socket.io pour /millegrilles
const debug = require('debug')('millegrilles:senseurspassifs:appSocketIo');

// Enregistre les evenements prive sur le socket
async function enregistrerPrive(socket, amqpdao) {
  debug("Enregistrer evenements prives sur socket %s", socket.id)
  socket.on('disconnect', ()=>{deconnexion(socket)})

  // Operation niveau prive
  socket.on('getListeNoeuds', cb => {getListeNoeuds(socket, cb)})
  socket.on('getListeSenseursNoeud', (params, cb) => {getListeSenseursNoeud(socket, params, cb)})

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
