import { wrap, releaseProxy } from 'comlink'
import { usagerDao } from '@dugrema/millegrilles.reactjs'

// Exemple de loader pour web workers
export function setupWorkers() {

  // Chiffrage et x509 sont combines, reduit taille de l'application
  const connexion = wrapWorker(new Worker(new URL('./connexion.worker', import.meta.url), {type: 'module'}))
  const chiffrage = wrapWorker(new Worker(new URL('./chiffrage.worker', import.meta.url), {type: 'module'}))

  const workerInstances = { chiffrage, connexion }

  const workers = Object.keys(workerInstances).reduce((acc, item)=>{
    acc[item] = workerInstances[item].proxy
    return acc
  }, {})
  
  // Pseudo-worker
  workers.usagerDao = usagerDao                   // IDB usager

  const ready = wireWorkers(workers)

  return { workerInstances, workers, ready }
}

async function wireWorkers(workers) {
  const { connexion, chiffrage } = workers

  const location = new URL(window.location)
  location.pathname = '/fiche.json'
  // console.debug("Charger fiche ", location.href)

  const axiosImport = await import('axios')
  const axios = axiosImport.default
  const reponse = await axios.get(location.href)
  console.debug("Reponse fiche ", reponse)
  const data = reponse.data || {}
  const fiche = JSON.parse(data.contenu)
  const ca = fiche.ca
  if(ca) {
      // console.debug("initialiserCertificateStore (connexion, chiffrage)")
      await Promise.all([
          connexion.initialiserCertificateStore(ca, {isPEM: true, DEBUG: false}),
          chiffrage.initialiserCertificateStore(ca, {isPEM: true, DEBUG: false}),
          chiffrage.init(ca),  // x509
      ])
  } else {
      throw new Error("Erreur initialisation - fiche/CA non disponible")
  }
}

function wrapWorker(worker) {
  const proxy = wrap(worker)
  return {proxy, worker}
}

export function cleanupWorkers(workers) {
  Object.values(workers).forEach((workerInstance) => {
    try {
      const {worker, proxy} = workerInstance
      proxy[releaseProxy]()
      worker.terminate()
    } catch(err) {
      console.warn("Errreur fermeture worker : %O\n(Workers: %O)", err, workers)
    }
  })
}
