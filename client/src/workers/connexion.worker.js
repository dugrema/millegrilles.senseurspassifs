import { expose } from 'comlink'
import * as ConnexionClient from '@dugrema/millegrilles.reactjs/src/connexionClient'
// import { hacheurs } from '@dugrema/millegrilles.reactjs'
// import { setHacheurs } from '@dugrema/millegrilles.utiljs'

// setHacheurs(hacheurs)

const CONST_DOMAINE_SENSEURSPASSIFS = 'SenseursPassifs',
      CONST_SENSEURSPASSIFS_RELAI = 'senseurspassifs_relai'

function getListeNoeuds() {
  return ConnexionClient.emitBlocking('getListeNoeuds', {}, {domaine: CONST_DOMAINE_SENSEURSPASSIFS, action: 'listeNoeuds', ajouterCertificat: true})
}

function getListeSenseursNoeud(instance_id, opts) {
  opts = opts || {}
  const partition = opts.partition || instance_id
  console.debug("getListeSenseursNoeud, instance_id: %s", instance_id)
  return ConnexionClient.emitBlocking(
    'getListeSenseursNoeud', 
    {instance_id}, 
    {
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
      domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
      action: 'majSenseur', 
      ajouterCertificat: true,
      partition,
    }
  )
}

function challengeAppareil(commande) {
  return ConnexionClient.emitBlocking('challengeAppareil', commande, {
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'challengeAppareil', 
    ajouterCertificat: true,
  })
}

function signerAppareil(commande) {
  return ConnexionClient.emitBlocking('signerAppareil', commande, {
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'signerAppareil', 
    ajouterCertificat: true,
  })
}

function getAppareilsEnAttente(commande) {
  commande = commande || {}
  return ConnexionClient.emitBlocking('getAppareilsEnAttente', commande, {
    domaine: CONST_DOMAINE_SENSEURSPASSIFS, 
    action: 'getAppareilsEnAttente', 
    ajouterCertificat: true,
  })
}

function commandeAppareil(instance_id, commande) {
  commande = commande || {}
  return ConnexionClient.emitBlocking('commandeAppareil', commande, {
    domaine: CONST_SENSEURSPASSIFS_RELAI, 
    partition: instance_id,
    action: 'commandeAppareil', 
    ajouterCertificat: true,
  })
}


// Evenements

async function ecouterEvenementsAppareilsUsager(cb) {
  // console.debug("ecouterEvenementsAppareilsUsager cb")
  // ConnexionClient.socketOn('evenement.SenseursPassifs.lectureConfirmee', cb)
  // const resultat = await ConnexionClient.emitBlocking('ecouterEvenementsAppareilsUsager', {}, {noformat: true})
  // if(!resultat) {
  //   throw new Error("Erreur ecouterEvenementsAppareilsUsager")
  // }
  return ConnexionClient.subscribe('ecouterEvenementsAppareilsUsager', cb, {}) 
}

async function retirerEvenementsAppareilsUsager(cb) {
  // ConnexionClient.socketOff('evenement.SenseursPassifs.lectureConfirmee')
  // const resultat = await ConnexionClient.emitBlocking('retirerEvenementsAppareilsUsager', {}, {noformat: true})
  // if(!resultat) {
  //   throw new Error("Erreur retirerEvenementsAppareilsUsager")
  // }
  return ConnexionClient.unsubscribe('retirerEvenementsAppareilsUsager', cb, {}) 
}

// async function ecouterEvenementsSenseurs(cb) {
//   ConnexionClient.socketOn('evenement.SenseursPassifs.lectureConfirmee', cb)
//   const resultat = await ConnexionClient.emitBlocking('ecouterEvenementsSenseurs', {}, {noformat: true})
//   if(!resultat) {
//     throw new Error("Erreur ecouterEvenementsSenseurs")
//   }
// }

// async function retirerEvenementsSenseurs() {
//   ConnexionClient.socketOff('evenement.SenseursPassifs.lectureConfirmee')
//   const resultat = await ConnexionClient.emitBlocking('retirerEvenementsSenseurs', {}, {noformat: true})
//   if(!resultat) {
//     throw new Error("Erreur retirerEvenementsSenseurs")
//   }
// }

// function ecouterEvenementsSenseurs(cb) { 
//   const params = {}
//   return ConnexionClient.subscribe('ecouterEvenementsSenseurs', cb, params)
// }

// function retirerEvenementsSenseurs(cb) { 
//   const params = {}
//   return ConnexionClient.unsubscribe('retirerEvenementsSenseurs', cb, params) 
// }


// async function ecouterEvenementsNoeuds(cb) {
//   ConnexionClient.socketOn('evenement.SenseursPassifs.majNoeudConfirmee', cb)
//   const resultat = await ConnexionClient.emitBlocking('ecouterEvenementsNoeuds', {}, {noformat: true})
//   if(!resultat) {
//     throw new Error("Erreur ecouterEvenementsNoeuds")
//   }
// }

// async function retirerEvenementsNoeuds() {
//   ConnexionClient.socketOff('evenement.SenseursPassifs.majNoeudConfirmee')
//   const resultat = await ConnexionClient.emitBlocking('retirerEvenementsNoeuds', {}, {noformat: true})
//   if(!resultat) {
//     throw new Error("Erreur retirerEvenementsNoeuds")
//   }
// }

// function ecouterEvenementsNoeuds(cb) { 
//   const params = {}
//   return ConnexionClient.subscribe('ecouterEvenementsNoeuds', cb, params)
// }

// function retirerEvenementsNoeuds(cb) { 
//   const params = {}
//   return ConnexionClient.unsubscribe('retirerEvenementsNoeuds', cb, params) 
// }

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

    // Event listeners proteges
    ecouterEvenementsAppareilsUsager, retirerEvenementsAppareilsUsager,
    // ecouterEvenementsSenseurs, retirerEvenementsSenseurs,
    // ecouterEvenementsNoeuds, retirerEvenementsNoeuds,

})
