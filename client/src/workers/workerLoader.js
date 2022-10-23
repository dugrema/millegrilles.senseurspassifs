import { wrap, releaseProxy } from 'comlink'

// Exemple de loader pour web workers
export function setupWorkers() {

  // Chiffrage et x509 sont combines, reduit taille de l'application
  const connexion = wrapWorker(new Worker(new URL('./connexion.worker', import.meta.url), {type: 'module'}))
  const chiffrage = wrapWorker(new Worker(new URL('./chiffrage.worker', import.meta.url), {type: 'module'}))

  const workers = { chiffrage, connexion }

  const location = new URL(window.location)
  location.pathname = '/fiche.json'

  import('axios')
    .then(axiosImport=>{
        const axios = axiosImport.default
        console.debug("Axios : ", axios)
        return axios.get(location.href)
      })
    .then(reponse=>{
      const fiche = reponse.data || {}
      const ca = fiche.ca
      if(ca) {
        return connexion.proxy.initialiserCertificateStore(ca, {isPEM: true, DEBUG: false})
      }
    })
    .catch(err=>{
      console.error("Erreur chargement fiche systeme : %O", err)
    })

  return workers
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
