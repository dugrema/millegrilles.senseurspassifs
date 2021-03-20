import {expose as comlinkExpose} from 'comlink'

import connexionClient from '@dugrema/millegrilles.common/lib/connexionClient'

const URL_SOCKET = '/senseurspassifs/socket.io'

function connecter(opts) {
  opts = opts || {}
  const url = opts.url || URL_SOCKET
  return connexionClient.connecter(url, opts)
}

// function requeteSites(params) {
//   return connexionClient.emitBlocking('publication/requeteSites', params)
// }

function getListeNoeuds() {
  return connexionClient.emitBlocking('SenseursPassifs/getListeNoeuds')
}

function getListeSenseursNoeud(noeud_id) {
  return connexionClient.emitBlocking('SenseursPassifs/getListeSenseursNoeud', noeud_id)
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
  return emitBlocking(this.socket, 'SenseursPassifs/setVpinLcd', {noeud_id, lcd_vpin_onoff, lcd_vpin_navigation})
}

function setAffichageLcd(noeud_id, lcd_affichage) {
  return emitBlocking(this.socket, 'SenseursPassifs/setAffichageLcd', {noeud_id, lcd_affichage})
}

function setVpinSenseur(uuid_senseur, blynkVPins) {
  return connexionClient.emitBlocking('SenseursPassifs/setVpinSenseur', {uuid_senseur, blynkVPins})
}

function changerNomSenseur(uuid_senseur, nom) {
  return connexionClient.emitBlocking('SenseursPassifs/changerNomSenseur', {uuid_senseur, nom})
}

comlinkExpose({
  ...connexionClient,
  connecter,  // Override de connexionClient.connecter

  getListeNoeuds, getListeSenseursNoeud, changerNomNoeud, changerSecuriteNoeud,
  setActiviteBlynk, setServerBlynk, setAuthTokenBlynk, setActiviteLcd, setVpinLcd,
  setAffichageLcd, setVpinSenseur, changerNomSenseur,
})
