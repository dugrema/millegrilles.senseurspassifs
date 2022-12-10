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
      {eventName: 'getAppareilsUsager', callback: (params, cb) => traiter(socket, mqdao.getAppareilsUsager, {params, cb}) },
      {eventName: 'challengeAppareil', callback: (params, cb) => traiter(socket, mqdao.challengeAppareil, {params, cb}) },
      {eventName: 'signerAppareil', callback: (params, cb) => traiter(socket, mqdao.signerAppareil, {params, cb}) },
      {eventName: 'getAppareilsEnAttente', callback: (params, cb) => traiter(socket, mqdao.getAppareilsEnAttente, {params, cb}) },
      {eventName: 'majAppareil', callback: (params, cb) => traiter(socket, mqdao.majAppareil, {params, cb}) },
      {eventName: 'getStatistiquesSenseur', callback: (params, cb) => traiter(socket, mqdao.getStatistiquesSenseur, {params, cb}) },

      // {eventName: 'getListeNoeuds', callback: (params, cb) => traiter(socket, mqdao.getListeNoeuds, {params, cb}) },
      // {eventName: 'getListeSenseursNoeud', callback: (params, cb) => traiter(socket, mqdao.getListeSenseursNoeud, {params, cb}) },
      // {eventName: 'majNoeud', callback: (params, cb) => traiter(socket, mqdao.majNoeud, {params, cb}) },
      // {eventName: 'majSenseur', callback: (params, cb) => traiter(socket, mqdao.majSenseur, {params, cb}) },

      // Listeners
      {eventName: 'ecouterEvenementsAppareilsUsager', callback: (_, cb) => {mqdao.ecouterEvenementsAppareilsUsager(socket, cb)}},
      {eventName: 'retirerEvenementsAppareilsUsager', callback: (_, cb) => {mqdao.retirerEvenementsAppareilsUsager(socket, cb)}},
      // {eventName: 'ecouterEvenementsSenseurs', callback: (_, cb) => {mqdao.ecouterEvenementsSenseurs(socket, cb)}},
      // {eventName: 'retirerEvenementsSenseurs', callback: (_, cb) => {mqdao.retirerEvenementsSenseurs(socket, cb)}},
      // {eventName: 'ecouterEvenementsNoeuds', callback: (_, cb) => {mqdao.ecouterEvenementsNoeuds(socket, cb)}},
      // {eventName: 'retirerEvenementsNoeuds', callback: (_, cb) => {mqdao.retirerEvenementsNoeuds(socket, cb)}},
    ]
  }

  return configurationEvenements
}

async function traiter(socket, methode, {params, cb}) {
  const reponse = await methode(socket, params)
  if(cb) cb(reponse)
}
