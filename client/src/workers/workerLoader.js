import { wrap } from 'comlink'

import ChiffrageWorker from './chiffrage.worker'
import ConnexionWorker from './connexion.worker'

// Exemple de loader pour web workers
export function chargerWorkers() {
    // Chiffrage et x509 sont combines, reduit taille de l'application
    const {worker: chiffrage} = charger(ChiffrageWorker)
    const x509 = chiffrage

    const {worker: connexion} = charger(ConnexionWorker)
    connexion.setX509Worker(chiffrage).catch(err=>console.error("Erreur chargement connexion worker : %O", err))

    const workers = {
        chiffrage, 
        connexion, 
        x509,
    }

    return workers
}

function charger(ClasseWorker) {
    const instance = new ClasseWorker()
    const worker = wrap(instance)
    return {instance, worker}
}