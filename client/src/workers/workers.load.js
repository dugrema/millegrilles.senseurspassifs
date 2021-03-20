import {wrap as comlinkWrap, proxy as comlinkProxy, releaseProxy} from 'comlink'
import {getCertificats, getClesPrivees} from '@dugrema/millegrilles.common/lib/browser/dbUsager'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

/* eslint-disable-next-line */
import ChiffrageWorker from 'worker-loader!@dugrema/millegrilles.common/lib/browser/chiffrage.worker'
import ConnexionWorker from './connexion.worker'

export async function setupWorkers(app) {
  /* Fonction pour componentDidMount : setupWorker(this) */

  const [chiffrage, connexion] = await Promise.all([
    initialiserWorkerChiffrage(app.callbackCleMillegrille),
    initialiserConnexion(app)
  ])
  console.debug("Workers prets")

  app.setState({
    connexionWorker: connexion.proxy,
    connexionInstance: connexion.workerInstance,
    chiffrageWorker: chiffrage.proxy,
    chiffrageInstance: chiffrage.workerInstance,
  })

  return {chiffrage, connexion}
}

export function cleanupWorkers(app) {
  /* Fonction pour componentWillUnmount : cleanupWorkers(this) */

  try {
    if(app.state.chiffrageWorker) {
      console.debug("Nettoyage worker chiffrage, release proxy")
      app.state.chiffrageWorker[releaseProxy]()
      app.state.chiffrageInstance.terminate()
      app.setState({chiffrageWorker: null, chiffrageInstance: null})
    }
  } catch(err) {console.error("Erreur fermeture worker chiffrage")}

  try {
    if(app.state.connexionWorker) {
      console.debug("Nettoyage worker, connexion release proxy")
      app.state.connexionWorker[releaseProxy]()
      app.state.connexionInstance.terminate()
      app.setState({connexionWorker: null, connexionInstance: null})
    }
  } catch(err) {console.error("Erreur fermeture worker chiffrage")}
}

async function initialiserWorkerChiffrage(callbackCleMillegrille) {
  try {
    const workerInstance = new ChiffrageWorker()
    const proxy = await comlinkWrap(workerInstance)

    // const cbCleMillegrille = comlinkProxy(callbackCleMillegrille)
    // chiffrageWorker.initialiserCallbackCleMillegrille(cbCleMillegrille)

    return { workerInstance, proxy }

  } catch(err) {
    console.error("Erreur initilisation worker chiffrate : %O", err)
  }
}

async function initialiserConnexion(app) {
  const workerInstance = new ConnexionWorker()
  const proxy = await comlinkWrap(workerInstance)

  await connecterReact(proxy, app)

  return { workerInstance, proxy }
}

async function connecterReact(connexionWorker, app) {
  /* Helper pour connecter le worker avec socketIo.
     - connexionWorker : proxu de connexionWorker deja initialise
     - app : this d'une classe React */
  const infoIdmg = await connexionWorker.connecter()
  console.debug("Connexion socket.io completee, info idmg : %O", infoIdmg)
  app.setState({...infoIdmg})

  connexionWorker.socketOn('disconnect', app.deconnexionSocketIo)
  connexionWorker.socketOn('modeProtege', app.setEtatProtege)
  connexionWorker.socketOn('reconnect', app.reconnectSocketIo)
}

export async function preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker) {
  // Initialiser certificat de MilleGrille et cles si presentes
  const certInfo = await getCertificats(nomUsager)
  if(certInfo && certInfo.fullchain) {
    const fullchain = splitPEMCerts(certInfo.fullchain)
    const clesPrivees = await getClesPrivees(nomUsager)

    // Initialiser le CertificateStore
    await chiffrageWorker.initialiserCertificateStore([...fullchain].pop(), {isPEM: true, DEBUG: false})
    console.debug("Certificat : %O, Cles privees : %O", certInfo.fullchain, clesPrivees)

    // Initialiser web worker
    await chiffrageWorker.initialiserFormatteurMessage({
      certificatPem: certInfo.fullchain,
      clePriveeSign: clesPrivees.signer,
      clePriveeDecrypt: clesPrivees.dechiffrer,
      DEBUG: true
    })

    await connexionWorker.initialiserFormatteurMessage({
      certificatPem: certInfo.fullchain,
      clePriveeSign: clesPrivees.signer,
      clePriveeDecrypt: clesPrivees.dechiffrer,
      DEBUG: true
    })
  } else {
    throw new Error("Pas de cert")
  }
}
