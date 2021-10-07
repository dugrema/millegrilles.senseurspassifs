import {expose as comlinkExpose} from 'comlink'
import multibase from 'multibase'
import path from 'path'

import connexionClient from '@dugrema/millegrilles.common/lib/connexionClient'
import { getRandomValues } from '@dugrema/millegrilles.common/lib/chiffrage'

const URL_SOCKET = '/senseurspassifs'

const ROUTING_KEYS_NOEUDS = [
  'evenement.SenseursPassifs.majNoeudConfirmee'
]

const ROUTING_KEYS_EVENEMENTS = [
  'evenement.SenseursPassifs.lectureConfirmee',
]

var _callbackSetEtatConnexion,
    _callbackPreparerCles,
    _x509Worker,
    _urlCourant = '',
    _connecte = false,
    _protege = false

function setCallbacks(setEtatConnexion, x509Worker, callbackPreparerCles) {
  _callbackSetEtatConnexion = setEtatConnexion
  _x509Worker = x509Worker
  _callbackPreparerCles = callbackPreparerCles
}

function estActif() {
  return _urlCourant && _connecte && _protege
}

async function connecter(opts) {
  opts = opts || {}

  let urlApp = null
  if(opts.url) {
    urlApp = new URL(opts.url)
  } else {
    if(!urlApp) {
      urlApp = new URL(opts.location)
      urlApp.pathname = URL_SOCKET
    }
  }

  if(urlApp === _urlCourant) return

  const urlSocketio = new URL(urlApp.href)
  urlSocketio.pathname = path.join(urlSocketio.pathname, 'socket.io')

  console.debug("Socket.IO connecter avec url %s", urlSocketio.href)

  const hostname = 'https://' + urlSocketio.host
  const pathSocketio = urlSocketio.pathname

  console.debug("Connecter socket.io a url host: %s, path: %s", hostname, pathSocketio)
  const connexion = connexionClient.connecter(urlSocketio.href, opts)

  connexionClient.socketOn('connect', _=>{
    console.debug("socket.io connecte a %O", urlSocketio)
    _connecte = true
    _urlCourant = urlApp
    onConnect()
      .then(protege=>{
        _protege = protege
        if(_callbackSetEtatConnexion) _callbackSetEtatConnexion(protege)
      })
  })
  connexionClient.socketOn('reconnect', _=>{
    console.debug("Reconnecte")
    _connecte = true
    onConnect()
      .then(protege=>{
        _protege = protege
        if(_callbackSetEtatConnexion) _callbackSetEtatConnexion(protege)
      })
  })
  connexionClient.socketOn('disconnect', _=>{
    console.debug("Disconnect socket.io")
    _connecte = false
    _protege = false
    if(_callbackSetEtatConnexion) _callbackSetEtatConnexion(false)
  })
  connexionClient.socketOn('connect_error', err=>{
    console.debug("Erreur socket.io : %O", err)
    _connecte = false
    _protege = false
    if(_callbackSetEtatConnexion) _callbackSetEtatConnexion(false)
  })

  return connexion
}

async function onConnect() {

  // S'assurer que la connexion est faite avec le bon site
  const randomBytes = new Uint8Array(64)
  await getRandomValues(randomBytes)
  const challenge = String.fromCharCode.apply(null, multibase.encode('base64', randomBytes))
  const reponse = await new Promise(async (resolve, reject)=>{
    console.debug("Emission challenge connexion Socket.io : %O", challenge)
    const timeout = setTimeout(_=>{
      reject('Timeout')
    }, 15000)
    const reponse = await connexionClient.emitBlocking('challenge', {challenge, noformat: true})
    console.debug("Reponse challenge connexion Socket.io : %O", reponse)
    clearTimeout(timeout)

    if(reponse.reponse === challenge) {
      resolve(reponse)
    } else{
      reject('Challenge mismatch')
    }
  })

  // Initialiser les cles, stores, etc pour tous les workers avec
  // le nom de l'usager. Le certificat doit exister et etre valide pour la
  // millegrille a laquelle on se connecte.
  const nomUsager = reponse.nomUsager
  console.debug("Callback preparer cles avec nom usager %s", nomUsager)
  await _callbackPreparerCles(nomUsager)

  // Valider la reponse signee
  // const signatureValide = await _verifierSignature(reponse)
  const signatureValide = await _x509Worker.verifierMessage(reponse)
  if(!signatureValide) {
    throw new Error("Signature de la reponse invalide, serveur non fiable")
  }

  // console.debug("Signature du serveur est valide")
  // On vient de confirmer que le serveur a un certificat valide qui correspond
  // a la MilleGrille. L'authentification du client se fait automatiquement
  // avec le certificat (mode prive ou protege).

  // Faire l'upgrade protege
  const resultatProtege = await connexionClient.upgradeProteger()
  console.debug("Resultat upgrade protege : %O", resultatProtege)

  // Emettre l'evenement qui va faire enregistrer les evenements de mise a jour
  // pour le mapping, siteconfig et sections
  connexionClient.emit('ecouterMaj')

  return resultatProtege
}

function getListeNoeuds() {
  return connexionClient.emitBlocking(
    'SenseursPassifs/getListeNoeuds',
    {},
    {domaine: 'SenseursPassifs', action: 'listeNoeuds', attacherCertificat: true}
  )
}

function getListeSenseursNoeud(partition, noeud_id) {
  return connexionClient.emitBlocking(
    'SenseursPassifs/getListeSenseursNoeud',
    {partition, noeud_id},
    {domaine: 'SenseursPassifs', action: 'listeSenseursPourNoeud', attacherCertificat: true}
  )
}

function majNoeud(partition, params) {
  console.debug("majNoeud, partition: %s, params: %O", partition, params)
  return connexionClient.emitBlocking(
    'SenseursPassifs/majNoeud',
    {partition, ...params},
    {domaine: 'SenseursPassifs', action: 'majNoeud', partition, attacherCertificat: true}
  )
}

function majSenseur(partition, params, nom) {
  return connexionClient.emitBlocking(
    'SenseursPassifs/majSenseur',
    {partition, ...params},
    {domaine: 'SenseursPassifs', action: 'majSenseur', attacherCertificat: true}
  )
}

async function ecouterEvenementsSenseurs(cb) {
  ROUTING_KEYS_EVENEMENTS.forEach(item=>{connexionClient.socketOn(item, cb)})
  const resultat = await connexionClient.emitBlocking('SenseursPassifs/ecouterEvenementsSenseurs', {}, {noformat: true})
  if(!resultat) {
    throw new Error("Erreur ecouterEvenementsSenseurs")
  }
}

async function retirerEvenementsSenseurs() {
  ROUTING_KEYS_EVENEMENTS.forEach(item=>{connexionClient.socketOff(item)})
  const resultat = await connexionClient.emitBlocking('SenseursPassifs/retirerEvenementsSenseurs', {}, {noformat: true})
  if(!resultat) {
    throw new Error("Erreur retirerEvenementsSenseurs")
  }
}

async function ecouterEvenementsNoeuds(cb) {
  console.debug('ecouterEvenementsNoeuds enregistrer cb %O', cb)
  ROUTING_KEYS_NOEUDS.forEach(item=>{connexionClient.socketOn(item, cb)})
  const resultat = await connexionClient.emitBlocking('SenseursPassifs/ecouterEvenementsNoeuds', {}, {noformat: true})
  if(!resultat) {
    throw new Error("Erreur ecouterEvenementsNoeuds")
  }
}

async function retirerEvenementsNoeuds() {
  ROUTING_KEYS_NOEUDS.forEach(item=>{connexionClient.socketOff(item)})
  const resultat = await connexionClient.emitBlocking('SenseursPassifs/retirerEvenementsNoeuds', {}, {noformat: true})
  if(!resultat) {
    throw new Error("Erreur retirerEvenementsNoeuds")
  }
}

comlinkExpose({
  ...connexionClient,
  connecter,  // Override de connexionClient.connecter
  setCallbacks, estActif,

  getListeNoeuds, getListeSenseursNoeud, majNoeud, majSenseur,

  ecouterEvenementsSenseurs, retirerEvenementsSenseurs,
  ecouterEvenementsNoeuds, retirerEvenementsNoeuds,
})
