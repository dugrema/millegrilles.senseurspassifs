import { wrap } from 'comlink'

import ChiffrageWorker from './chiffrage.worker'
import ConnexionWorker from './connexion.worker'

// Exemple de loader pour web workers
export function chargerWorkers() {
    const {worker: chiffrage} = charger(ChiffrageWorker)
    const {worker: connexion} = charger(ConnexionWorker)

    // Chiffrage et x509 sont combines, reduit taille de l'application
    const x509 = chiffrage

    const workers = {
        chiffrage, 
        connexion, 
        x509,
    }

    connexion.setX509Worker(chiffrage).catch(err=>console.error("Erreur chargement connexion worker : %O", err))

    return workers
}

function charger(ClasseWorker) {
    const instance = new ClasseWorker()
    const worker = wrap(instance)
    return {instance, worker}
}