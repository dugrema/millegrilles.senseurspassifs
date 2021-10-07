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

var // _callbackSiteMaj,
    // _callbackSectionMaj,
    _callbackSetEtatConnexion,
    _callbackPreparerCles,
    // _resolverWorker,
    _x509Worker,
    // _verifierSignature,   // web worker resolver (utilise pour valider signature messages)
    // _siteConfig,
    _urlCourant = '',
    // _urlBase = '',
    _connecte = false,
    _protege = false

function setCallbacks(setEtatConnexion, x509Worker, callbackPreparerCles) {
  _callbackSetEtatConnexion = setEtatConnexion
  _x509Worker = x509Worker
  _callbackPreparerCles = callbackPreparerCles
  // console.debug("setCallbacks connexionWorker : %O, %O", setEtatConnexion, x509Worker, callbackPreparerCles)
}

function estActif() {
  return _urlCourant && _connecte && _protege
}


// function connecter(opts) {
//   opts = opts || {}
//   var url = opts.url
//   if(!url) {
//     // Utiliser le serveur local mais remplacer le pathname par URL_SOCKET
//     const urlLocal = new URL(opts.location)
//     urlLocal.pathname = URL_SOCKET
//     urlLocal.hash = ''
//     urlLocal.search = ''
//     url = urlLocal.href
//   }
//   console.debug("Connecter socket.io sur url %s", url)
//   return connexionClient.connecter(url, opts)
// }

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
  // console.debug("url choisi : %O", urlApp)

  if(urlApp === _urlCourant) return
  // _urlCourant = null  // Reset url courant

  const urlSocketio = new URL(urlApp.href)
  urlSocketio.pathname = path.join(urlSocketio.pathname, 'socket.io')

  console.debug("Socket.IO connecter avec url %s", urlSocketio.href)
  // return connexionClient.connecter(url, opts)

  // const urlInfo = new URL(url)
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

// function requeteSites(params) {
//   return connexionClient.emitBlocking('publication/requeteSites', params)
// }

function getListeNoeuds() {
  return connexionClient.emitBlocking('SenseursPassifs/getListeNoeuds', null, {domaine: 'SenseursPassifs', attacherCertificat: true})
}

function getListeSenseursNoeud(partition, noeud_id) {
  return connexionClient.emitBlocking(
    'SenseursPassifs/getListeSenseursNoeud',
    {partition, noeud_id},
    {domaine: 'SenseursPassifs', action: 'listeSenseursPourNoeud', attacherCertificat: true}
  )
}

function changerNomNoeud(noeud_id, nom) {
  return connexionClient.emitBlocking('SenseursPassifs/changerNomNoeud', {noeud_id, nom})
}

function changerSecuriteNoeud(noeud_id, securite) {
  return connexionClient.emitBlocking('SenseursPassifs/changerSecuriteNoeud', {noeud_id, securite})
}

function setActiviteBlynk(noeud_id, activite) {
  return connexionClient.emitBlocking('SenseursPassifs/setActiviteBlynk', {noeud_id, activite})
}

function setServerBlynk(noeud_id, host, port) {
  return connexionClient.emitBlocking('SenseursPassifs/setServerBlynk', {noeud_id, host, port})
}

function setAuthTokenBlynk(noeud_id, authToken) {
  return connexionClient.emitBlocking('SenseursPassifs/setAuthTokenBlynk', {noeud_id, authToken})
}

function setActiviteLcd(noeud_id, activite) {
  return connexionClient.emitBlocking('SenseursPassifs/setActiviteLcd', {noeud_id, activite})
}

function setVpinLcd(noeud_id, lcd_vpin_onoff, lcd_vpin_navigation) {
  return connexionClient.emitBlocking('SenseursPassifs/setVpinLcd', {noeud_id, lcd_vpin_onoff, lcd_vpin_navigation})
}

function setAffichageLcd(noeud_id, lcd_affichage) {
  return connexionClient.emitBlocking('SenseursPassifs/setAffichageLcd', {noeud_id, lcd_affichage})
}

function setVpinSenseur(uuid_senseur, blynkVPins) {
  return connexionClient.emitBlocking('SenseursPassifs/setVpinSenseur', {uuid_senseur, blynkVPins})
}

function changerNomSenseur(uuid_senseur, nom) {
  return connexionClient.emitBlocking('SenseursPassifs/changerNomSenseur', {uuid_senseur, nom})
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
  // console.debug("Retrait ecoute evenement enregistrerCallbackTranscodageProgres %s", fuuid)
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
  // console.debug("Retrait ecoute evenement enregistrerCallbackTranscodageProgres %s", fuuid)
}

comlinkExpose({
  ...connexionClient,
  connecter,  // Override de connexionClient.connecter
  setCallbacks, estActif,

  getListeNoeuds, getListeSenseursNoeud, changerNomNoeud, changerSecuriteNoeud,
  setActiviteBlynk, setServerBlynk, setAuthTokenBlynk, setActiviteLcd, setVpinLcd,
  setAffichageLcd, setVpinSenseur, changerNomSenseur,

  ecouterEvenementsSenseurs, retirerEvenementsSenseurs,
  ecouterEvenementsNoeuds, retirerEvenementsNoeuds,
})
