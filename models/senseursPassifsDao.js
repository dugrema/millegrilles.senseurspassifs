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
    const domaineAction = 'SenseursPassifs.listeNoeuds'
    debug("Transaction, domaineAction : ", domaineAction)

    const listeSenseurs = await this.amqDao.transmettreRequete(
      domaineAction, {}, {decoder: true}
    )

    return listeSenseurs
  }

  getListeSenseursNoeud = async (noeud_id) => {
    const domaineAction = 'SenseursPassifs.listeSenseursPourNoeud'
    const params = { noeud_id }
    debug("getListeSenseursNoeud, domaineAction : %s, %O", domaineAction, params)

    const listeSenseurs = await this.amqDao.transmettreRequete(
      domaineAction, params, {decoder: true}
    )

    return listeSenseurs
  }

  changerNomNoeud = async (noeud_id, nomNoeud) => {
    const domaineAction = 'SenseursPassifs.majNoeud'
    const params = { noeud_id, descriptif: nomNoeud }
    debug("changerNomNoeud, domaineAction : %s, %O", domaineAction, params)

    const listeSenseurs = await this.amqDao.transmettreRequete(
      domaineAction, params, {decoder: true}
    )

    return listeSenseurs
  }

  changerSecuriteNoeud = async (noeud_id, securite) => {
    const domaineAction = 'SenseursPassifs.majNoeud'
    const params = { noeud_id, securite }
    debug("changerSecuriteNoeud, domaineAction : %s, %O", params, domaineAction)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaineAction
    )

    return listeSenseurs
  }

  setAuthTokenBlynk = async (noeud_id, authToken) => {
    const domaineAction = 'SenseursPassifs.majNoeud'
    const params = { noeud_id, blynk_auth: authToken }
    debug("setAuthTokenBlynk, domaineAction : %s, %O", domaineAction, params)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaineAction
    )

    return listeSenseurs
  }

  setServerBlynk = async (noeud_id, host, port) => {
    const domaineAction = 'SenseursPassifs.majNoeud'
    const params = { noeud_id, blynk_host: host, blynk_port: port }
    debug("setServerBlynk, domaineAction : %s, %O", domaineAction, params)

    const listeSenseurs = await this.amqDao.transmettreTransactionFormattee(
      params, domaineAction,
    )
  }

  setSecuriteSenseur = async securite => {

  }

  setNomSenseur = async nomSenseur => {

  }

  setVpinSenseur = async (noeud_id, vpin) => {

  }

}

module.exports = { SenseursPassifsDao }
