const debug = require('debug')('millegrilles:senseurspassifs:dao')

class SenseursPassifsDao {

  constructor(amqDao) {
    this.amqDao = amqDao
    this.idmg = amqDao.pki.idmg
  }

  subscribe(socket, routingKeys, exchange) {
    let channel = this.amqDao.channel
    const reply_q = this.amqDao.reply_q
    return this.amqDao.routingKeyManager.addRoutingKeysForSocket(socket, routingKeys, exchange, channel, reply_q)
  }

  unsubscribe(socket, routingKeys, exchange) {
    let channel = this.amqDao.channel
    const reply_q = this.amqDao.reply_q
    this.amqDao.routingKeyManager.removeRoutingKeysForSocket(socket, routingKeys, exchange, channel, reply_q)
  }

  getListeNoeuds = async _ => {
    const domaine = 'SenseursPassifs',
          action = 'listeNoeuds'
    debug("getListeNoeuds, rk : %s.%s", domaine, action)

    const listeSenseurs = await this.amqDao.transmettreRequete(
      domaine, {}, {action: 'listeNoeuds', decoder: true}
    )

    return listeSenseurs
  }

  getListeSenseursNoeud = async requete => {
    const domaine = 'SenseursPassifs',
          action = 'listeSenseursPourNoeud',
          partition = requete.partition
    debug("getListeSenseursNoeud, routing : %s.%s.%s, %O", domaine, partition, action, requete)
    if(requete['en-tete'].domaine === domaine && requete['en-tete'].action === action) {
      return await this.amqDao.transmettreRequete(domaine, requete, {action, partition, noformat: true, decoder: true})
    } else {
      return {ok: false}
    }
  }

  changerNomNoeud = async (partition, noeud_id, nomNoeud) => {
    const domaine = 'SenseursPassifs',
          action = 'majNoeud'
    const params = { noeud_id, descriptif: nomNoeud }
    debug("changerNomNoeud, routing : %s.%s.%s, %O", domaine, partition, action, params)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )

    return listeSenseurs
  }

  changerSecuriteNoeud = async (partition, noeud_id, securite) => {
    const domaine = 'SenseursPassifs',
          action = 'majNoeud'
    const params = { noeud_id, securite }
    debug("changerSecuriteNoeud, routing : %s.%s, %O", domaine, action, params)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )

    return listeSenseurs
  }

  // setActiviteBlynk = async (noeud_id, activite) => {
  //   const domaineAction = 'SenseursPassifs.majNoeud'
  //   const params = { noeud_id, blynk_actif: activite }
  //   debug("setActiviteBlynk, domaineAction : %s, %O", domaineAction, params)
  //   return await this.amqDao.transmettreTransactionFormattee(
  //     params, domaineAction
  //   )
  // }
  //
  // setAuthTokenBlynk = async (noeud_id, authToken) => {
  //   const domaineAction = 'SenseursPassifs.majNoeud'
  //   const params = { noeud_id, blynk_auth: authToken }
  //   debug("setAuthTokenBlynk, domaineAction : %s, %O", domaineAction, params)
  //   return await this.amqDao.transmettreTransactionFormattee(
  //     params, domaineAction
  //   )
  // }
  //
  // setServerBlynk = async (noeud_id, host, port) => {
  //   const domaineAction = 'SenseursPassifs.majNoeud'
  //   const params = { noeud_id, blynk_host: host, blynk_port: port }
  //   debug("setServerBlynk, domaineAction : %s, %O", domaineAction, params)
  //
  //   const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
  //     params, domaineAction,
  //   )
  // }

  setActiviteLcd = async (partition, noeud_id, activite) => {
    const domaine = 'SenseursPassifs',
          action = 'majNoeud'
    const params = { noeud_id, lcd_actif: activite }
    debug("setServerBlynk, routing : %s.%s.%s, %O", domaine, partition, action, params)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )
  }

  setVpinLcd = async (partition, noeud_id, lcd_vpin_onoff, lcd_vpin_navigation) => {
    const domaine = 'SenseursPassifs',
          action = 'majNoeud'
    const params = { noeud_id, lcd_vpin_onoff, lcd_vpin_navigation }
    debug("setServerBlynk, routing : %s.%s.%s, %O", domaine, partition, action, params)
    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )
  }

  setAffichageLcd = async (partition, noeud_id, lcd_affichage) => {
    const domaine = 'SenseursPassifs',
          action = 'majNoeud'
    const params = { noeud_id, lcd_affichage }
    debug("setAffichageLcd, routing : %s.%s.%s, %O", domaine, partition, action, params)
    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )
  }

  setSecuriteSenseur = async securite => {

  }

  changerNomSenseur = async (uuid_senseur, nomSenseur) => {
    const domaine = 'SenseursPassifs',
          action = 'majSenseur'
    const params = { uuid_senseur, descriptif: nomSenseur }
    debug("changerNomNoeud, routing : %s.%s.%s, %O", domaine, partition, action, params)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )
  }

  setVpinSenseur = async (uuid_senseur, vpins) => {
    const domaine = 'SenseursPassifs',
          action = 'majSenseur'

    if(Object.keys(vpins).length === 0) {
      throw new Error("Il faut fournir au moins une vpin a modifier")
    }

    // Mapper pour la transaction : { senseurs: {'temp': {'blynk_vpin': NN} } }
    const senseurs = {}
    for(let app in vpins) {
      senseurs[app] = {'blynk_vpin': vpins[app]}
    }

    const params = { uuid_senseur, senseurs }
    debug("setVpinSenseur, routing : %s.%s.%s, %O", domaine, partition, action, params)

    await this.amqDao.transmettreTransactionFormattee(
      params, domaine, {action, partition}
    )
  }

}

module.exports = { SenseursPassifsDao }
