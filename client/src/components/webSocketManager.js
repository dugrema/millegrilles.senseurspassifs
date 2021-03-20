import {WebSocketClient} from '@dugrema/millegrilles.common/lib/webSocketClient'

export class WebSocketSenseursPassifs extends WebSocketClient {

  getListeNoeuds() {
    return new Promise((resolve, reject)=>{
      this.socket.emit('SenseursPassifs/getListeNoeuds', reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  getListeSenseursNoeud(noeud_id) {
    return new Promise((resolve, reject)=>{
      this.socket.emit('SenseursPassifs/getListeSenseursNoeud', noeud_id, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  changerNomNoeud(noeud_id, nom) {
    return new Promise((resolve, reject)=>{
      // console.debug("Changer nom noeud : %s = %s", noeud_id, nom)
      this.socket.emit('SenseursPassifs/changerNomNoeud', {noeud_id, nom}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  changerSecuriteNoeud(noeud_id, securite) {
    return new Promise((resolve, reject)=>{
      // console.debug("Changer securite noeud : %s = %s", noeud_id, securite)
      this.socket.emit('SenseursPassifs/changerSecuriteNoeud', {noeud_id, securite}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  setActiviteBlynk(noeud_id, activite) {
    return new Promise((resolve, reject)=>{
      // console.debug("Changer serveur blynk noeud : %s, %s:%d", noeud_id, host, port)
      this.socket.emit('SenseursPassifs/setActiviteBlynk', {noeud_id, activite}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  setServerBlynk(noeud_id, host, port) {
    return new Promise((resolve, reject)=>{
      // console.debug("Changer serveur blynk noeud : %s, %s:%d", noeud_id, host, port)
      this.socket.emit('SenseursPassifs/setServerBlynk', {noeud_id, host, port}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  setAuthTokenBlynk(noeud_id, authToken) {
    return new Promise((resolve, reject)=>{
      // console.debug("Changer serveur blynk noeud : %s", noeud_id)
      this.socket.emit('SenseursPassifs/setAuthTokenBlynk', {noeud_id, authToken}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  setActiviteLcd(noeud_id, activite) {
    return emitBlocking(this.socket, 'SenseursPassifs/setActiviteLcd', {noeud_id, activite})
  }

  setVpinLcd(noeud_id, lcd_vpin_onoff, lcd_vpin_navigation) {
    return emitBlocking(this.socket, 'SenseursPassifs/setVpinLcd', {noeud_id, lcd_vpin_onoff, lcd_vpin_navigation})
  }

  setAffichageLcd(noeud_id, lcd_affichage) {
    return emitBlocking(this.socket, 'SenseursPassifs/setAffichageLcd', {noeud_id, lcd_affichage})
  }

  setVpinSenseur(uuid_senseur, blynkVPins) {
    return new Promise((resolve, reject)=>{
      // console.debug("Changer setVpinSenseur blynk noeud : %s, vpins: %O", uuid_senseur, blynkVPins)
      this.socket.emit('SenseursPassifs/setVpinSenseur', {uuid_senseur, blynkVPins}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

  changerNomSenseur(uuid_senseur, nom) {
    return new Promise((resolve, reject)=>{
      // console.debug("changerNomSenseur uuid_senseur : %s = %s", uuid_senseur, nom)
      this.socket.emit('SenseursPassifs/changerNomSenseur', {uuid_senseur, nom}, reponse=>{
        if(reponse.err) reject(reponse.err)
        resolve(reponse)
      })
    })
  }

}

function emitBlocking(socket, event, params) {
  return new Promise((resolve, reject)=>{
    const timeout = setTimeout(_=>{reject({err: 'Timeout'})}, 7500)
    const traiterReponse = reponse => {
      clearTimeout(timeout)
      if(reponse.err) return reject(reponse.err)
      resolve(reponse)
    }
    if(params) {
      socket.emit(event, params, traiterReponse)
    } else {
      socket.emit(event, traiterReponse)
    }
  })
}
