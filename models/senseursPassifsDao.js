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

  getListeNoeuds = async requete => {
    const domaine = 'SenseursPassifs',
          action = 'listeNoeuds'
    debug("getListeNoeuds, rk : %s.%s", domaine, action)

    // const listeSenseurs = await this.amqDao.transmettreRequete(
    //   domaine, {}, {action: 'listeNoeuds', decoder: true}
    // )
    //
    debug("getListeNoeuds, routing : %s.%s, %O", domaine, action, requete)
    if(requete['en-tete'].domaine === domaine && requete['en-tete'].action === action) {
      return await this.amqDao.transmettreRequete(domaine, requete, {action, noformat: true, decoder: true})
    } else {
      return {ok: false}
    }

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

  majNoeud = params => {
    const domaine = 'SenseursPassifs',
          action = 'majNoeud',
          partition = params.partition
    debug("majNoeud, routing : %s.%s.%s, %O", domaine, partition, action, params)
    let entete = params['en-tete']
    if(entete.domaine === domaine && entete.action === action) {
      return this.amqDao.transmettreEnveloppeTransaction(params, domaine)
    } else {
      return {ok: false}
    }
  }

  majSenseur = params => {
    const domaine = 'SenseursPassifs',
          action = 'majSenseur',
          partition = params.partition
    debug("majSenseur, routing : %s.%s.%s, %O", domaine, partition, action, params)
    let entete = params['en-tete']
    if(entete.domaine === domaine && entete.action === action) {
      return this.amqDao.transmettreEnveloppeTransaction(params, domaine)
    } else {
      return {ok: false}
    }
  }

}

module.exports = { SenseursPassifsDao }
