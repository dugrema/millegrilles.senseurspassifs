import {wrap as comlinkWrap, proxy as comlinkProxy, releaseProxy} from 'comlink'
import {getCertificats, getClesPrivees} from '@dugrema/millegrilles.common/lib/browser/dbUsager'

import ChiffrageWorker from '@dugrema/millegrilles.common/lib/browser/chiffrage.worker'
import X509Worker from '@dugrema/millegrilles.common/lib/browser/x509.worker'
import ConnexionWorker from './connexion.worker'

export async function setupWorkers() {
  const [chiffrage, x509, connexion] = await Promise.all([
    initialiserWorkerChiffrage(),
    initialiserX509(),
    initialiserConnexion(),
  ])

  return {chiffrage, x509, connexion}
}

async function initialiserWorkerChiffrage(callbackCleMillegrille) {
  try {
    const workerInstance = new ChiffrageWorker()
    const chiffrageWorker = comlinkWrap(workerInstance)
    return { workerInstance, chiffrageWorker }
  } catch(err) {
    console.error("Erreur initilisation worker chiffrate : %O", err)
  }
}

function initialiserX509() {
  const workerInstance = new X509Worker()
  const connexionWorker = comlinkWrap(workerInstance)

  return { workerInstance, x509Worker: connexionWorker }
}

async function initialiserConnexion(app) {
  const workerInstance = new ConnexionWorker()
  const connexionWorker = comlinkWrap(workerInstance)
  return { workerInstance, connexionWorker }
}

export async function preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker, x509Worker) {
  // Initialiser certificat de MilleGrille et cles si presentes
  const certInfo = await getCertificats(nomUsager)
  if(certInfo && certInfo.fullchain) {
    const fullchain = certInfo.fullchain
    const clesPrivees = await getClesPrivees(nomUsager)

    const caPem = [...fullchain].pop()

    // Initialiser le CertificateStore
    await chiffrageWorker.initialiserCertificateStore(caPem, {isPEM: true, DEBUG: false})
    // console.debug("preparerWorkersAvecCles Certificat : %O, Cles privees : %O", certInfo.fullchain, clesPrivees)

    // Initialiser verification x509
    await x509Worker.init(caPem)

    // Initialiser web worker
    await chiffrageWorker.initialiserFormatteurMessage({
      certificatPem: certInfo.fullchain,
      clePriveeSign: clesPrivees.signer,
      clePriveeDecrypt: clesPrivees.dechiffrer,
      DEBUG: false
    })

    await connexionWorker.initialiserFormatteurMessage({
      certificatPem: certInfo.fullchain,
      clePriveeSign: clesPrivees.signer,
      clePriveeDecrypt: clesPrivees.dechiffrer,
      DEBUG: false
    })
  } else {
    throw new Error("Pas de cert")
  }
}
