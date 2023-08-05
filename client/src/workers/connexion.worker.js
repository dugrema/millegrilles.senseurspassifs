import { expose } from 'comlink'
import * as ConnexionClient from '@dugrema/millegrilles.reactjs/src/connexionClient'
import { MESSAGE_KINDS } from '@dugrema/millegrilles.utiljs/src/constantes'

const CONST_DOMAINE_SENSEURSPASSIFS = 'SenseursPassifs',
      CONST_SENSEURSPASSIFS_RELAI = 'senseurspassifs_relai'

function getListeNoeuds() {
  return ConnexionClient.emitBlocking('getListeNoeuds', {}, {
    kind: MESSAGE_KINDS.KIND_REQUETE, 
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, action: 'listeNoeuds', ajouterCertificat: true})
}

function getListeSenseursNoeud(instance_id, opts) {
  opts = opts || {}
  const partition = opts.partition || instance_id
  console.debug("getListeSenseursNoeud, instance_id: %s", instance_id)
  return ConnexionClient.emitBlocking(
    'getListeSenseursNoeud', 
    {instance_id}, 
    {
      kind: MESSAGE_KINDS.KIND_REQUETE, 
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'listeSenseursPourNoeud', 
      ajouterCertificat: true,
      partition,
    }
  )
}

function getAppareilsUsager(requete) {
  requete = requete || {}
  return ConnexionClient.emitBlocking(
    'getAppareilsUsager',
    requete,
    {
      kind: MESSAGE_KINDS.KIND_REQUETE, 
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'getAppareilsUsager', 
      ajouterCertificat: true,
    }
  )
}

function getStatistiquesSenseur(requete) {
  return ConnexionClient.emitBlocking(
    'getStatistiquesSenseur',
    requete,
    {
      kind: MESSAGE_KINDS.KIND_REQUETE, 
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'getStatistiquesSenseur', 
      ajouterCertificat: true,
    }
  )
}

function majAppareil(params) {
  return ConnexionClient.emitBlocking(
    'majAppareil', 
    params, 
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'majAppareil', 
      ajouterCertificat: true,
    }
  )
}

function majNoeud(partition, params) {
  return ConnexionClient.emitBlocking(
    'majNoeud', 
    params, 
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'majNoeud', 
      ajouterCertificat: true,
      partition,
    }
  )
}

function majSenseur(partition, params) {
  return ConnexionClient.emitBlocking(
    'majSenseur', 
    params, 
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'majSenseur', 
      ajouterCertificat: true,
      partition,
    }
  )
}

function challengeAppareil(commande) {
  return ConnexionClient.emitBlocking('challengeAppareil', commande, {
    kind: MESSAGE_KINDS.KIND_COMMANDE, 
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'challengeAppareil', 
    ajouterCertificat: true,
  })
}

function signerAppareil(commande) {
  return ConnexionClient.emitBlocking('signerAppareil', commande, {
    kind: MESSAGE_KINDS.KIND_COMMANDE, 
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'signerAppareil', 
    ajouterCertificat: true,
  })
}

function getAppareilsEnAttente(commande) {
  commande = commande || {}
  return ConnexionClient.emitBlocking('getAppareilsEnAttente', commande, {
    kind: MESSAGE_KINDS.KIND_REQUETE, 
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'getAppareilsEnAttente', 
    ajouterCertificat: true,
  })
}

function commandeAppareil(instance_id, commande) {
  commande = commande || {}
  return ConnexionClient.emitBlocking('commandeAppareil', commande, {
    kind: MESSAGE_KINDS.KIND_COMMANDE, 
    domaine: CONST_SENSEURSPASSIFS_RELAI, 
    partition: instance_id,
    action: 'commandeAppareil', 
    ajouterCertificat: true,
  })
}

function supprimerAppareil(uuid_appareil) {
  const commande = { uuid_appareil }
  return ConnexionClient.emitBlocking('supprimerAppareil', commande, {
    kind: MESSAGE_KINDS.KIND_COMMANDE, 
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'supprimerAppareil', 
    ajouterCertificat: true,
  })
}

function restaurerAppareil(uuid_appareil) {
  const commande = { uuid_appareil }
  return ConnexionClient.emitBlocking('restaurerAppareil', commande, {
    kind: MESSAGE_KINDS.KIND_COMMANDE, 
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'restaurerAppareil', 
    ajouterCertificat: true,
  })
}

// Evenements

async function ecouterEvenementsAppareilsUsager(cb) {
  return ConnexionClient.subscribe('ecouterEvenementsAppareilsUsager', cb, {}) 
}

async function retirerEvenementsAppareilsUsager(cb) {
  return ConnexionClient.unsubscribe('retirerEvenementsAppareilsUsager', cb, {}) 
}

// Exposer methodes du Worker
expose({
    ...ConnexionClient, 

    // Requetes et commandes privees
    getAppareilsUsager, 
    majAppareil, 
    challengeAppareil, signerAppareil, getAppareilsEnAttente,

    getListeSenseursNoeud, getStatistiquesSenseur,
    getListeNoeuds, majNoeud, 
    majSenseur, commandeAppareil,
    supprimerAppareil, restaurerAppareil,

    // Event listeners proteges
    ecouterEvenementsAppareilsUsager, retirerEvenementsAppareilsUsager,

})
