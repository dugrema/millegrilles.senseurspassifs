import debugLib from 'debug'
const debug = debugLib('mqdao')

// const L3Protege = '3.protege'
const L2Prive = '2.prive'

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
    return transmettreRequete(socket, params, 'listeNoeuds')
}

export function getListeSenseursNoeud(socket, params) {
    return transmettreRequete(socket, params, 'listeSenseursPourNoeud')
}

export function majNoeud(socket, params) {
    return transmettreCommande(socket, params, 'majNoeud')
}

export function majSenseur(socket, params) {
    return transmettreCommande(socket, params, 'majSenseur')
}

async function transmettreRequete(socket, params, action, opts) {
    opts = opts || {}
    const entete = params['en-tete'] || {}
    const domaine = opts.domaine || entete.domaine || DOMAINE_SENSEURSPASSIFS
    const partition = opts.partition || entete.partition
    const exchange = opts.exchange || L2Prive
    try {
        verifierMessage(params, domaine, action)
        return await socket.amqpdao.transmettreRequete(
            domaine, 
            params, 
            {action, partition, exchange, noformat: true, decoder: true}
        )
    } catch(err) {
        console.error("mqdao.transmettreRequete ERROR : %O", err)
        return {ok: false, err: ''+err}
    }
}

async function transmettreCommande(socket, params, action, opts) {
    opts = opts || {}
    const entete = params['en-tete'] || {}
    const domaine = opts.domaine || entete.domaine || DOMAINE_SENSEURSPASSIFS
    const partition = opts.partition || entete.partition
    const exchange = opts.exchange || L2Prive
    const nowait = opts.nowait
    try {
        verifierMessage(params, domaine, action)
        return await socket.amqpdao.transmettreCommande(
            domaine, 
            params, 
            {action, partition, exchange, noformat: true, decoder: true, nowait}
        )
    } catch(err) {
        console.error("mqdao.transmettreCommande ERROR : %O", err)
        return {ok: false, err: ''+err}
    }
}

/* Fonction de verification pour eviter abus de l'API */
function verifierMessage(message, domaine, action) {
    console.debug("Verifier domaine %s action %s pour %O", domaine, action, message)
    const entete = message['en-tete'] || {},
          domaineRecu = entete.domaine,
          actionRecue = entete.action
    if(domaineRecu !== domaine) throw new Error(`Mismatch domaine (${domaineRecu} !== ${domaine})"`)
    if(actionRecue !== action) throw new Error(`Mismatch action (${actionRecue} !== ${action})"`)
}

export async function ecouterEvenementsSenseurs(socket, cb) {
    const opts = {
        routingKeys: ['evenement.SenseursPassifs.lectureConfirmee'],
        exchange: [L2Prive],
    }
    socket.subscribe(opts, cb)
}

export async function retirerEvenementsSenseurs(socket, cb) {
    const routingKeys = ['3.protege/evenement.SenseursPassifs.lectureConfirmee']
    socket.unsubscribe({routingKeys})
    if(cb) cb(true)
}

export async function ecouterEvenementsNoeuds(socket, cb) {
    const opts = {
        routingKeys: ['evenement.SenseursPassifs.majNoeudConfirmee'],
        exchange: [L2Prive],
    }
    socket.subscribe(opts, cb)
}

export async function retirerEvenementsNoeuds(socket, cb) {
    const routingKeys = ['3.protege/evenement.SenseursPassifs.majNoeudConfirmee']
    socket.unsubscribe({routingKeys})
    if(cb) cb(true)
}

