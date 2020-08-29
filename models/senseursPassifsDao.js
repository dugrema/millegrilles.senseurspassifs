const debug = require('debug')('millegrilles:messagerie:messageriedao')

class SenseursPassifsDao {

  constructor(amqDao) {
    this.amqDao = amqDao
    this.idmg = amqDao.pki.idmg
  }

  getListeContacts = async nomUsager => {
    const domaineAction = 'Messagerie.chargerCompte'
    const requete = {'nom_usager': nomUsager}
    debug("Transaction, domaineAction : ", domaineAction)
    debug(requete)

    const listeContacts = await this.amqDao.transmettreRequete(
      domaineAction, requete, {decoder: true})

    return listeContacts.contacts
  }

  getSommaireMessages = async (nomUsager, idmgsActifs) => {
    const domaineAction = 'Messagerie.sommaireMessagesParIdmg'
    const requete = {'idmgs': idmgsActifs}
    debug("Transaction, domaineAction : ", domaineAction)
    debug(requete)

    const sommaireMessage = await this.amqDao.transmettreRequete(
      domaineAction, requete, {decoder: true})

    return sommaireMessage
  }

  getMessagesUsagerParSource = async (nomUsager, idmgsActifsUsager, idmgsContact) => {
    const domaineAction = 'Messagerie.messagesUsagerParSource'
    const requete = {
      nom_usager: nomUsager,
      idmgs_destination: idmgsActifsUsager,
      idmgs_source: idmgsContact,
    }
    debug("Transaction, domaineAction : ", domaineAction)
    debug(requete)

    const listeMessages = await this.amqDao.transmettreRequete(
      domaineAction, requete, {decoder: true})

    return listeMessages
  }

}

module.exports = { SenseursPassifsDao }
