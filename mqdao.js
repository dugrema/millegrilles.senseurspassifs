import debugLib from 'debug'
const debug = debugLib('mqdao')

const L3Protege = '3.protege'

const DOMAINE_SENSEURSPASSIFS = 'SenseursPassifs'

const ROUTING_KEYS_NOEUDS = [
'evenement.SenseursPassifs.majNoeudConfirmee'
]

const ROUTING_KEYS_SENSEURS = [
'evenement.SenseursPassifs.lectureConfirmee',
]
      
export function challenge(socket, params) {
    // Repondre avec un message signe
    const reponse = {
        reponse: params.challenge,
        message: 'Trust no one',
        nomUsager: socket.nomUsager,
        userId: socket.userId,
    }
    return socket.amqpdao.pki.formatterMessage(reponse, 'challenge', {ajouterCertificat: true})
}

export function getListeNoeuds(socket, params) {
    return transmettreRequete(socket, params, 'documentsParTuuid')
}

export function getListeSenseursNoeud(socket, params) {
    return transmettreRequete(socket, params, 'documentsParTuuid')
}

export function majNoeud(socket, params) {
    return transmettreCommande(socket, params, 'nouvelleCollection')
}

export function majSenseur(socket, params) {
    return transmettreCommande(socket, params, 'nouvelleCollection')
}

async function transmettreRequete(socket, params, action, opts) {
    opts = opts || {}
    const domaine = opts.domaine || DOMAINE_SENSEURSPASSIFS
    const exchange = opts.exchange || L3Protege
    try {
        verifierMessage(params, domaine, action)
        return await socket.amqpdao.transmettreRequete(
            domaine, 
            params, 
            {action, exchange, noformat: true, decoder: true}
        )
    } catch(err) {
        console.error("mqdao.transmettreRequete ERROR : %O", err)
        return {ok: false, err: ''+err}
    }
}

async function transmettreCommande(socket, params, action, opts) {
    opts = opts || {}
    const domaine = opts.domaine || DOMAINE_SENSEURSPASSIFS
    const exchange = opts.exchange || L3Protege
    const nowait = opts.nowait
    try {
        verifierMessage(params, domaine, action)
        return await socket.amqpdao.transmettreCommande(
            domaine, 
            params, 
            {action, exchange, noformat: true, decoder: true, nowait}
        )
    } catch(err) {
        console.error("mqdao.transmettreCommande ERROR : %O", err)
        return {ok: false, err: ''+err}
    }
}

/* Fonction de verification pour eviter abus de l'API */
function verifierMessage(message, domaine, action) {
    const entete = message['en-tete'] || {},
          domaineRecu = entete.domaine,
          actionRecue = entete.action
    if(domaineRecu !== domaine) throw new Error(`Mismatch domaine (${domaineRecu} !== ${domaine})"`)
    if(actionRecue !== action) throw new Error(`Mismatch action (${actionRecue} !== ${action})"`)
}

export async function ecouterEvenementsSenseurs(socket, params, cb) {
    const opts = {
        routingKeys: ['evenement.SenseursPassifs.lectureConfirmee'],
        exchange: [L3Protege],
    }
    socket.subscribe(opts, cb)
}

export async function retirerEvenementsSenseurs(socket, params, cb) {
    const routingKeys = ['3.protege/evenement.SenseursPassifs.lectureConfirmee']
    socket.unsubscribe({routingKeys})
    if(cb) cb(true)
}

export async function ecouterEvenementsNoeuds(socket, params, cb) {
    const opts = {
        routingKeys: ['evenement.SenseursPassifs.majNoeudConfirmee'],
        exchange: [L3Protege],
    }
    socket.subscribe(opts, cb)
}

export async function retirerEvenementsNoeuds(socket, params, cb) {
    const routingKeys = ['3.protege/evenement.SenseursPassifs.majNoeudConfirmee']
    socket.unsubscribe({routingKeys})
    if(cb) cb(true)
}

