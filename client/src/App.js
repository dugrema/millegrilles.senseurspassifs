import React, {Suspense, useState, useEffect, useMemo} from 'react'
import { useTranslation } from 'react-i18next'

import { Provider as ReduxProvider, useDispatch } from 'react-redux'

import Container from 'react-bootstrap/Container'

import ErrorBoundary from './ErrorBoundary'
import useWorkers, {useEtatConnexion, useEtatConnexionOpts, WorkerProvider, useUsager, useFormatteurPret, useInfoConnexion} from './WorkerContext'
import storeSetup from './redux/store'

import { setUserId as setUserIdAppareils, verifierExpiration } from './redux/appareilsSlice'

import i18n from './i18n'

import { LayoutMillegrilles, ModalErreur, initI18n, OuvertureSessionModal } from '@dugrema/millegrilles.reactjs'

// Importer JS global
import 'react-bootstrap/dist/react-bootstrap.min.js'

// Importer cascade CSS global
import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'
import "react-datetime/css/react-datetime.css"
import '@dugrema/millegrilles.reactjs/dist/index.css'

import './index.scss'
import './App.css'

import manifest from './manifest.build'

// Wire i18n dans module @dugrema/millegrilles.reactjs
initI18n(i18n)

const Menu = React.lazy( () => import('./Menu') )
const Accueil = React.lazy( () => import('./Accueil') )
const Configuration = React.lazy( () => import('./Configuration') )

// const _contexte = {}  // Contexte global pour comlink proxy callbacks

function App() {
  
  return (
    <WorkerProvider attente={<Attente />}>
      <ErrorBoundary>
        <Suspense fallback={<Attente />}>
          <ProviderReduxLayer />
        </Suspense>
      </ErrorBoundary>
    </WorkerProvider>
  )

}
export default App

function ProviderReduxLayer() {

  const workers = useWorkers()
  const store = useMemo(()=>{
    if(!workers) return
    return storeSetup(workers)
  }, [workers])

  return (
    <ReduxProvider store={store}>
        <LayoutMain />
    </ReduxProvider>
  )
}

function LayoutMain(props) {

  const { i18n, t } = useTranslation()

  const dispatch = useDispatch()
  const workers = useWorkers()
  const usager = useUsager()
  const etatConnexion = useEtatConnexion()
  const etatConnexionOpts = useEtatConnexionOpts()
  const etatFormatteurMessage = useFormatteurPret()
  const infoConnexion = useInfoConnexion()

  const [sectionAfficher, setSectionAfficher] = useState('')
  const [erreur, setErreur] = useState('')
  
  const handlerCloseErreur = () => setErreur(false)

  const etatAuthentifie = usager && etatFormatteurMessage

  const [userId, estProprietaire] = useMemo(()=>{
    if(!usager) return [null, null]
    const extensions = usager.extensions
    return [extensions.userId, extensions.delegationGlobale === 'proprietaire']
  }, [usager])
  console.debug("Est proprietaire : %O", estProprietaire)

  // Setup userId dans redux
  useEffect(()=>{
    dispatch(setUserIdAppareils(userId))
  }, [dispatch, userId])

  // Intervalle pour entretien appareils
  useEffect(()=>{
    const interval = setInterval(()=>dispatch(verifierExpiration()), 20_000)
    return () => clearInterval(interval)
  }, [dispatch])

  const menu = (
    <Menu
        i18n={i18n} 
        estProprietaire={estProprietaire}
        setSectionAfficher={setSectionAfficher} 
        manifest={manifest} />
  ) 

  return (
      <LayoutMillegrilles menu={menu}>

          <div className='top-spacer-menu'></div>
          
          <Container className="contenu">

              <Suspense fallback={<Attente workers={workers} idinfoConnexionmg={infoConnexion} etatConnexion={etatAuthentifie} />}>
                <ApplicationSenseursPassifs 
                    workers={workers}
                    usager={usager}
                    etatAuthentifie={etatAuthentifie}
                    etatConnexion={etatConnexion}
                    infoConnexion={infoConnexion}
                    sectionAfficher={sectionAfficher}
                    setSectionAfficher={setSectionAfficher}
                  />
              </Suspense>

          </Container>

          <ModalErreur show={!!erreur} err={erreur.err} message={erreur.message} titre={t('Erreur.titre')} fermer={handlerCloseErreur} />
          <OuvertureSessionModal 
              workers={workers}
              etatConnexion={etatConnexion} 
              etatConnexionOpts={etatConnexionOpts} 
              usager={usager}
            />

      </LayoutMillegrilles>
  )  

}

function ApplicationSenseursPassifs(props) {

  const { sectionAfficher, setSectionAfficher} = props

  let Page = null
  switch(sectionAfficher) {
    case 'Configuration':
      Page = Configuration; break
    default:
      Page = Accueil
  }

  return (
    <Container className="main-body">
      <Page setSectionAfficher={setSectionAfficher} />
    </Container>
  )

}

function Attente(_props) {
  return (
      <div>
          <p className="titleinit">Preparation de Coup D'Oeil</p>
          <p>Veuillez patienter durant le chargement de la page.</p>
          <ol>
              <li>Initialisation</li>
              <li>Chargement des composants dynamiques</li>
              <li>Connexion a la page</li>
          </ol>
      </div>
  )
}
