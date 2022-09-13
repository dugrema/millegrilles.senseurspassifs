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

// const _contexte = {}  // Contexte global pour comlink proxy callbacks

function App(props) {

  const { i18n, t } = useTranslation()

  const [workers, setWorkers] = useState('')
  const [usager, setUsager] = useState('')
  const [sectionAfficher, setSectionAfficher] = useState('')
  const [etatConnexion, setEtatConnexion] = useState(false)
  const [etatFormatteurMessage, setEtatFormatteurMessage] = useState(false)
  const [idmg, setIdmg] = useState('')
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
        .then(infoConnexion=>{console.debug("Info connexion : %O", infoConnexion)})
        .catch(err=>{console.debug("Erreur de connexion : %O", err)})
    }
  }, [workers, setUsager, setEtatConnexion, setEtatFormatteurMessage])

  useEffect(()=>{
    if(!etatConnexion) return 
    workers.chiffrage.getIdmgLocal().then(idmg=>{
      console.debug("IDMG local chiffrage : %O", idmg)
      setIdmg(idmg)
    })
  }, [workers, etatConnexion, setIdmg])
  
  // const rootProps = {
  //   usager, changerPage, page, paramsPage
  // }

  const menu = (
    <MenuApp 
        i18n={i18n} 
        etatConnexion={etatConnexion}
        idmg={idmg}
        workers={workers} 
        usager={usager} />
  ) 

  return (
      <LayoutMillegrilles menu={menu}>

          <Container className="contenu">

              <Suspense fallback={<Attente workers={workers} idmg={idmg} etatConnexion={etatAuthentifie} />}>
                <ApplicationSenseursPassifs 
                    workers={workers}
                    usager={usager}
                    etatAuthentifie={etatAuthentifie}
                    noeudId={noeudId}
                    setNoeudId={setNoeudId}
                  />
              </Suspense>

          </Container>

          <ModalErreur show={!!erreur} err={erreur.err} message={erreur.message} titre={t('Erreur.titre')} fermer={handlerCloseErreur} />

      </LayoutMillegrilles>
  )  

  // return (
  //   <LayoutApplication>
      
  //     <HeaderApplication>
  //       <Menu 
  //         workers={workers} 
  //         usager={usager} 
  //         etatConnexion={etatConnexion} 
  //         setPage={setPage}
  //       />
  //     </HeaderApplication>

  //     <Container>
  //       <Suspense fallback={<Attente />}>
  //         <ApplicationSenseursPassifs 
  //           rootProps={rootProps}
  //           workers={workers} 
  //           usager={usager}
  //           etatConnexion={etatConnexion} 
  //           etatAuthentifie={etatAuthentifie}
  //           page={page}
  //         />
  //       </Suspense>
  //     </Container>

  //     <FooterApplication>
  //       <Footer workers={workers} idmg={idmg} />
  //     </FooterApplication>
      
  //   </LayoutApplication>
  // )
}

export default App

async function connecter(...params) {
  const { connecter: connecterWorker } = await import('./workers/connecter')
  return connecterWorker(...params)
}

function ApplicationSenseursPassifs(props) {

  // console.debug("!!! ApplicationSenseursPassifs Proppys : %O", props)
  const { workers, sectionAfficher, etatAuthentifie, noeudId, setNoeudId } = props
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

  // const rootProps = {
  //   ...props.rootProps,
  //   manifest,
  // }

  // let pageRender
  // if(!etatAuthentifie) {
  //   pageRender = <p>Attente de connexion</p>
  // } else {
  //   // 3. Afficher application
  //   pageRender = <SectionContenu rootProps={rootProps}
  //                                workers={props.workers}
  //                                page={rootProps.page}
  //                                paramsPage={rootProps.paramsPage}
  //                                listeNoeuds={listeNoeuds}
  //                                majNoeud={traiterMessageNoeudsCb} 
  //                                etatAuthentifie={etatAuthentifie} />
  // }

  let Page = Accueil
  if(noeudId) {
    Page = Noeud
  }

  return (
    <Container className="main-body">
      <Page 
          workers={props.workers}
          listeNoeuds={listeNoeuds}
          etatAuthentifie={etatAuthentifie}      
          noeudId={noeudId}
          setNoeudId={setNoeudId}
          majNoeud={traiterMessageNoeudsCb} 
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

  const handlerSelect = eventKey => {
      switch(eventKey) {
        case 'information': setShowModalInfo(true); break
        case 'portail': window.location = '/millegrilles'; break
        case 'deconnecter': window.location = '/millegrilles/authentification/fermer'; break
        case 'Noeud': setSectionAfficher('Noeud'); break
        default:
      }
  }

  const handlerChangerLangue = eventKey => {i18n.changeLanguage(eventKey)}
  const brand = (
      <Navbar.Brand>
          <Nav.Link title={t('titre')}>
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
