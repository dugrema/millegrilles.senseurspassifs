import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { setupWorkers, cleanupWorkers } from './workers/workerLoader'
// import { init as initCollectionsIdb } from './redux/collectionsIdbDao'

const CONST_INTERVAL_VERIF_SESSION = 600_000

const Context = createContext()

const { workerInstances, workers: _workers, ready } = setupWorkers()

// Hooks
function useWorkers() {
    // return useContext(Context).workers
    return _workers
}
export default useWorkers

export function useUsager() {
    return useContext(Context).usager
}

export function useEtatConnexion() {
    return useContext(Context).etatConnexion
}

export function useFormatteurPret() {
    return useContext(Context).formatteurPret
}

export function useEtatAuthentifie() {
    return useContext(Context).etatAuthentifie
}

export function useInfoConnexion() {
    return useContext(Context).infoConnexion
}

export function useEtatPret() {
    return useContext(Context).etatPret
}

// Provider
export function WorkerProvider(props) {

    // const [workers, setWorkers] = useState('')
    const [workersPrets, setWorkersPrets] = useState(false)
    const [usager, setUsager] = useState('')
    const [etatConnexion, setEtatConnexion] = useState('')
    const [formatteurPret, setFormatteurPret] = useState('')
    const [infoConnexion, setInfoConnexion] = useState('')

    const etatAuthentifie = useMemo(()=>usager && formatteurPret, [usager, formatteurPret])
    const etatPret = useMemo(()=>{
        return etatConnexion && usager && formatteurPret
    }, [etatConnexion, usager, formatteurPret])

    const value = useMemo(()=>{
        if(workersPrets) return { usager, etatConnexion, formatteurPret, etatAuthentifie, infoConnexion, etatPret }
    }, [workersPrets, usager, etatConnexion, formatteurPret, etatAuthentifie, infoConnexion, etatPret])

    useEffect(()=>{
        // console.info("Initialiser web workers (ready : %O, workers : %O)", ready, _workers)

        // Initialiser workers et tables collections dans IDB
        // const promiseIdb = initCollectionsIdb()
        // Promise.all([ready, promiseIdb])
        //     .then(()=>{
        //         console.info("Workers prets")
        //         setWorkersPrets(true)
        //     })
        //     .catch(err=>console.error("Erreur initialisation collections IDB / workers ", err))
        setWorkersPrets(true)
        
        // Cleanup
        // return () => { 
        //     console.info("Cleanup web workers")
        //     cleanupWorkers(workerInstances) 
        // }
    }, [setWorkersPrets])

    useEffect(()=>{
        if(etatConnexion) {
            // Verifier etat connexion
            let interval = null
            verifierSession()
                .then(() => {interval = setInterval(verifierSession, CONST_INTERVAL_VERIF_SESSION)})
                .catch(redirigerPortail)
            return () => {
                if(interval) clearInterval(interval)
            }
        }
    }, [etatConnexion])

    useEffect(()=>{
        if(!workersPrets) return
        // setWorkersTraitementFichiers(workers)
        if(_workers.connexion) {
            // setErreur('')
            connecter(_workers, setUsager, setEtatConnexion, setFormatteurPret)
                .then(infoConnexion=>{
                    // const statusConnexion = JSON.stringify(infoConnexion)
                    if(infoConnexion.ok === false) {
                        console.error("Erreur de connexion : %O", infoConnexion)
                        // setErreur("Erreur de connexion au serveur : " + infoConnexion.err); 
                    } else {
                        console.info("Info connexion : %O", infoConnexion)
                        setInfoConnexion(infoConnexion)
                    }
                })
                .catch(err=>{
                    // setErreur('Erreur de connexion. Detail : ' + err); 
                    console.debug("Erreur de connexion : %O", err)
                })
        } else {
            // setErreur("Pas de worker de connexion")
            console.error("Pas de worker de connexion")
        }
    }, [ workersPrets, setUsager, setEtatConnexion, setFormatteurPret, setInfoConnexion ])

    useEffect(()=>{
        if(etatAuthentifie) {
          // Preload certificat maitre des cles
          _workers.connexion.getCertificatsMaitredescles()
            .catch(err=>console.error("Erreur preload certificat maitre des cles : %O", err))
        }
    }, [etatAuthentifie])
  
    if(!workersPrets) return props.attente

    return <Context.Provider value={value}>{props.children}</Context.Provider>
}

export function WorkerContext(props) {
    return <Context.Consumer>{props.children}</Context.Consumer>
}

async function connecter(workers, setUsager, setEtatConnexion, setFormatteurPret) {
    const { connecter: connecterWorker } = await import('./workers/connecter')
    return connecterWorker(workers, setUsager, setEtatConnexion, setFormatteurPret)
}

async function verifierSession() {
    try {
        const importAxios = await import('axios')
        // const reponse = await importAxios.default.get('/millegrilles/authentification/verifier')
        // console.debug("Reponse verifier session sur connexion : ", reponse)
        const reponseCollections = await importAxios.default.get('/senseurspassifs/initSession')
        console.debug("Reponse verifier session sur collections : ", reponseCollections)
    } catch(err) {
        redirigerPortail(err)
    }
}

function redirigerPortail(err) {
    console.error("Erreur verification session : ", err)
    const url = new URL(window.location.href)
    url.pathname = '/millegrilles'
    window.location = url
}