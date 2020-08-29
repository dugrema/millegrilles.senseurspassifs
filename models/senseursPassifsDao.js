const debug = require('debug')('millegrilles:senseurspassifs:dao')

class SenseursPassifsDao {

  constructor(amqDao) {
    this.amqDao = amqDao
    this.idmg = amqDao.pki.idmg
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
    debug("Transaction, domaineAction : %s, %O", domaineAction, params)

    const listeSenseurs = await this.amqDao.transmettreRequete(
      domaineAction, params, {decoder: true}
    )

    return listeSenseurs
  }

}

module.exports = { SenseursPassifsDao }
