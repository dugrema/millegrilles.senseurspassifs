import React, {Suspense, useState, useEffect, useMemo, useCallback} from 'react'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { proxy } from 'comlink'

// import { LayoutApplication, HeaderApplication, FooterApplication } from '@dugrema/millegrilles.reactjs'
import { LayoutMillegrilles, ModalErreur, Menu as MenuMillegrilles, DropDownLanguage, ModalInfo } from '@dugrema/millegrilles.reactjs'

import { setupWorkers, cleanupWorkers } from './workers/workerLoader'

import { useTranslation } from 'react-i18next'
import './i18n'

// Importer JS global
import 'react-bootstrap/dist/react-bootstrap.min.js'

// Importer cascade CSS global
import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'
import '@dugrema/millegrilles.reactjs/dist/index.css'

import manifest from './manifest.build'

import './index.scss'
import './App.css'

const Accueil = React.lazy( () => import('./Accueil') )
const Noeud = React.lazy( () => import('./Noeud') )
const Configuration = React.lazy( () => import('./Configuration') )

// const _contexte = {}  // Contexte global pour comlink proxy callbacks

function App(props) {

  const { i18n, t } = useTranslation()

  const [workers, setWorkers] = useState('')
  const [usager, setUsager] = useState('')
  const [sectionAfficher, setSectionAfficher] = useState('')
  const [etatConnexion, setEtatConnexion] = useState(false)
  const [etatFormatteurMessage, setEtatFormatteurMessage] = useState(false)
  const [infoConnexion, setInfoConnexion] = useState('')
  const [erreur, setErreur] = useState('')
  const [noeudId, setNoeudId] = useState('')
  
  const handlerCloseErreur = () => setErreur(false)

  const etatAuthentifie = usager && etatFormatteurMessage

  // Chargement des proprietes et workers
  useEffect(()=>{
      const workerInstances = setupWorkers()
      const workers = Object.keys(workerInstances).reduce((acc, item)=>{
        acc[item] = workerInstances[item].proxy
        return acc
      }, {})
      setWorkers(workers)
      return () => {
        console.info("Cleanup workers")
        cleanupWorkers(workerInstances)
      }
  }, [setWorkers])

  useEffect(()=>{
    if(workers && workers.connexion) {
      connecter(workers, setUsager, setEtatConnexion, setEtatFormatteurMessage)
        .then(infoConnexion=>{
          console.debug("Info connexion : %O", infoConnexion)
          setInfoConnexion(infoConnexion)
        })
        .catch(err=>{console.debug("Erreur de connexion : %O", err)})
    }
  }, [workers, setInfoConnexion, setUsager, setEtatConnexion, setEtatFormatteurMessage])

  // const rootProps = {
  //   usager, changerPage, page, paramsPage
  // }

  const menu = (
    <MenuApp 
        i18n={i18n} 
        etatConnexion={etatConnexion}
        infoConnexion={infoConnexion}
        workers={workers} 
        usager={usager} 
        setSectionAfficher={setSectionAfficher} />
  ) 

  return (
      <LayoutMillegrilles menu={menu}>

          <Container className="contenu">

              <Suspense fallback={<Attente workers={workers} idinfoConnexionmg={infoConnexion} etatConnexion={etatAuthentifie} />}>
                <ApplicationSenseursPassifs 
                    workers={workers}
                    usager={usager}
                    etatAuthentifie={etatAuthentifie}
                    etatConnexion={etatConnexion}
                    infoConnexion={infoConnexion}
                    noeudId={noeudId}
                    setNoeudId={setNoeudId}
                    sectionAfficher={sectionAfficher}
                    setSectionAfficher={setSectionAfficher}
                  />
              </Suspense>

          </Container>

          <ModalErreur show={!!erreur} err={erreur.err} message={erreur.message} titre={t('Erreur.titre')} fermer={handlerCloseErreur} />

      </LayoutMillegrilles>
  )  

}

export default App

async function connecter(...params) {
  const { connecter: connecterWorker } = await import('./workers/connecter')
  return connecterWorker(...params)
}

function ApplicationSenseursPassifs(props) {

  const { workers, usager, etatConnexion, infoConnexion, sectionAfficher, setSectionAfficher, etatAuthentifie, noeudId, setNoeudId } = props
  const connexion = workers.connexion

  const [listeNoeuds, setListeNoeuds] = useState('')
  const [messageNoeud, addMessageNoeud] = useState('')

  const traiterMessageNoeudsCb = useMemo(()=>proxy(addMessageNoeud), [addMessageNoeud])

  const handlerFermer = () => setNoeudId('')

  // Entretien du contexte global pour les callbacks comlink proxy
  useEffect(()=>{
    if(messageNoeud) {
      majNoeud(messageNoeud, listeNoeuds, setListeNoeuds)
      addMessageNoeud('')  // Clear queue
    }
  }, [messageNoeud, listeNoeuds, setListeNoeuds, addMessageNoeud])

  useEffect(()=>{
    if(connexion && etatAuthentifie && traiterMessageNoeudsCb) {
      connexion.ecouterEvenementsNoeuds(traiterMessageNoeudsCb)
        .catch(err=>{console.error("Erreur ecouterEvenementsNoeuds: %O", err)})
      return () => {
        connexion.retirerEvenementsNoeuds(traiterMessageNoeudsCb)
      }
    }
  }, [connexion, etatAuthentifie, traiterMessageNoeudsCb])

  useEffect(()=>{
    if(connexion && etatAuthentifie) {
      connexion.getListeNoeuds()
        .then(listeNoeuds=>{
          console.debug("Noeuds recus : %O", listeNoeuds)
          // Injecter partition dans les noeuds
          listeNoeuds.noeuds.forEach(n => {n.partition = listeNoeuds.partition})
          setListeNoeuds(listeNoeuds)
        })
        .catch(err=>{console.error("Erreur reception noeuds : %O", err)})

    }
  }, [connexion, etatAuthentifie])

  let Page = null
  switch(sectionAfficher) {
    case 'Configuration':
      Page = Configuration; break
    default:
      if(noeudId) Page = Noeud
      else Page = Accueil
  }

  return (
    <Container className="main-body">
      <Page 
          workers={props.workers}
          listeNoeuds={listeNoeuds}
          etatAuthentifie={etatAuthentifie}      
          etatConnexion={etatConnexion}
          infoConnexion={infoConnexion}
          usager={usager}
          noeudId={noeudId}
          setNoeudId={setNoeudId}
          majNoeud={traiterMessageNoeudsCb} 
          setSectionAfficher={setSectionAfficher}
          fermer={handlerFermer}
        />
    </Container>
  )

}

function majNoeud(evenement, listeNoeuds, setNoeuds) {
  console.debug("majNoeud message recu : %O", evenement)
  const {message, exchange} = evenement

  const instance_id = message.instance_id

  var trouve = false
  const noeudsMaj = listeNoeuds.noeuds.map(noeud=>{
    if(noeud.instance_id === instance_id) {
      trouve = true
      var copieNoeud = Object.assign({}, noeud)
      copieNoeud = Object.assign(copieNoeud, message)
      copieNoeud.partition = listeNoeuds.partition  // Copier partition du noeud
      return copieNoeud
    }
    return noeud
  })

  if(!trouve) {
    console.debug("majNoeud Nouveau noeud ajoute : %O", message)
    if(!message.securite) message.securite = exchange
    noeudsMaj.push(message)
  }

  setNoeuds({...listeNoeuds, noeuds: noeudsMaj})
}

function MenuApp(props) {

  const { i18n, etatConnexion, idmg, setSectionAfficher, usager } = props

  const { t } = useTranslation()
  const [showModalInfo, setShowModalInfo] = useState(false)
  const handlerCloseModalInfo = useCallback(()=>setShowModalInfo(false), [setShowModalInfo])

  const handlerSelect = useCallback(eventKey => {
      switch(eventKey) {
        case 'configuration': 
          setSectionAfficher('Configuration'); break
        default:
          setSectionAfficher('')
      }
  }, [setSectionAfficher])

  const handlerChangerLangue = eventKey => {i18n.changeLanguage(eventKey)}
  const brand = (
      <Navbar.Brand>
          <Nav.Link onClick={handlerSelect} title={t('titre')}>
              {t('titre')}
          </Nav.Link>
      </Navbar.Brand>
  )

  return (
      <>
          <MenuMillegrilles brand={brand} labelMenu="Menu" etatConnexion={etatConnexion} onSelect={handlerSelect}>
            <Nav.Link eventKey="information" title="Afficher l'information systeme">
                {t('menu.information')}
            </Nav.Link>
            <Nav.Link eventKey="configuration" title="Configuration des appareils">
                {t('menu.configuration')}
            </Nav.Link>
            <DropDownLanguage title={t('menu.language')} onSelect={handlerChangerLangue}>
                <NavDropdown.Item eventKey="en-US">English</NavDropdown.Item>
                <NavDropdown.Item eventKey="fr-CA">Francais</NavDropdown.Item>
            </DropDownLanguage>
            <Nav.Link eventKey="portail" title={t('menu.portail')}>
                {t('menu.portail')}
            </Nav.Link>
            <Nav.Link eventKey="deconnecter" title={t('menu.deconnecter')}>
                {t('menu.deconnecter')}
            </Nav.Link>
          </MenuMillegrilles>
          <ModalInfo 
              show={showModalInfo} 
              fermer={handlerCloseModalInfo} 
              manifest={manifest} 
              idmg={idmg} 
              usager={usager} />
      </>
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
