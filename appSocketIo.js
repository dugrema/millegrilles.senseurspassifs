// Gestion evenements socket.io pour /millegrilles
import debugLib from 'debug'
import * as mqdao from './mqdao.js'

const debug = debugLib('millegrilles:senseurspassifs:appSocketIo')

export function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPublics: [
      { eventName: 'challenge', callback: (params, cb) => traiter(socket, mqdao.challenge, {params, cb}) },
    ],
    listenersPrives: [
    ],
    listenersProteges: [
      {eventName: 'getListeNoeuds', callback: (params, cb) => traiter(socket, mqdao.getListeNoeuds, {params, cb}) },
      {eventName: 'getListeSenseursNoeud', callback: (params, cb) => traiter(socket, mqdao.getListeSenseursNoeud, {params, cb}) },
      {eventName: 'majNoeud', callback: (params, cb) => traiter(socket, mqdao.majNoeud, {params, cb}) },
      {eventName: 'majSenseur', callback: (params, cb) => traiter(socket, mqdao.majSenseur, {params, cb}) },

      // Listeners
      {eventName: 'ecouterEvenementsSenseurs', callback: (_, cb) => {mqdao.ecouterEvenementsSenseurs(socket, cb)}},
      {eventName: 'retirerEvenementsSenseurs', callback: (_, cb) => {mqdao.retirerEvenementsSenseurs(socket, cb)}},
      {eventName: 'ecouterEvenementsNoeuds', callback: (_, cb) => {mqdao.ecouterEvenementsNoeuds(socket, cb)}},
      {eventName: 'retirerEvenementsNoeuds', callback: (_, cb) => {mqdao.retirerEvenementsNoeuds(socket, cb)}},
    ]
  }

  console.debug("!!! Evenements configuration : %O", configurationEvenements)

  return configurationEvenements
}

async function traiter(socket, methode, {params, cb}) {
  console.debug("!!! traiter %O", params)
  const reponse = await methode(socket, params)
  if(cb) cb(reponse)
}
