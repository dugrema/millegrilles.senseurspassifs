import React, {Suspense, useState, useEffect, useMemo, useCallback} from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { proxy } from 'comlink'

import { LayoutApplication, HeaderApplication, FooterApplication } from '@dugrema/millegrilles.reactjs'

import Menu from './Menu'
import { SectionContenu } from './SectionContenu'

import { setupWorkers, cleanupWorkers } from './workers/workerLoader'

import './App.css'

var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}

const manifest = manifestImport

// const _contexte = {}  // Contexte global pour comlink proxy callbacks

function App(props) {
  const [workers, setWorkers] = useState('')
  const [usager, setUsager] = useState('')
  const [page, setPage] = useState('Accueil')
  const [paramsPage, setParamsPage] = useState('')
  const [etatConnexion, setEtatConnexion] = useState(false)
  const [etatFormatteurMessage, setEtatFormatteurMessage] = useState(false)
  const [idmg, setIdmg] = useState('')

  const etatAuthentifie = usager && etatFormatteurMessage

  const changerPage = useCallback(eventPage => {
    // Verifier si event ou page
    let pageSelectionnee
    var paramsPage = null
    if(eventPage.currentTarget) {
      var target = eventPage.currentTarget
      pageSelectionnee = target.value
      var dataset = target.dataset
      if(dataset) {
        paramsPage = {...dataset}
      }
    } else {
      pageSelectionnee = eventPage
    }

    setPage(pageSelectionnee)
    setParamsPage(paramsPage || '')
  }, [setPage, setParamsPage])


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
    
  const rootProps = {
    usager, changerPage, page, paramsPage
  }

  return (
    <LayoutApplication>
      
      <HeaderApplication>
        <Menu 
          workers={workers} 
          usager={usager} 
          etatConnexion={etatConnexion} 
          setPage={setPage}
        />
      </HeaderApplication>

      <Container>
        <Suspense fallback={<Attente />}>
          <ApplicationSenseursPassifs 
            rootProps={rootProps}
            workers={workers} 
            usager={usager}
            etatConnexion={etatConnexion} 
            etatAuthentifie={etatAuthentifie}
            page={page}
          />
        </Suspense>
      </Container>

      <FooterApplication>
        <Footer workers={workers} idmg={idmg} />
      </FooterApplication>
      
    </LayoutApplication>
  )
}

export default App

function Attente(props) {
  return <p>Chargement en cours</p>
}

// async function importerWorkers(setWorkers) {
//   const { chargerWorkers } = await import('./workers/workerLoader')
//   const workers = chargerWorkers()
//   setWorkers(workers)
// }

async function connecter(...params) {
  const { connecter: connecterWorker } = await import('./workers/connecter')
  return connecterWorker(...params)
}

function ApplicationSenseursPassifs(props) {

  // console.debug("!!! ApplicationSenseursPassifs Proppys : %O", props)

  const [listeNoeuds, setListeNoeuds] = useState('')
  const [messageNoeud, addMessageNoeud] = useState('')

  const connexion = props.workers.connexion,
        etatAuthentifie = props.etatAuthentifie

  const traiterMessageNoeudsCb = useMemo(()=>proxy(addMessageNoeud), [addMessageNoeud])

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

  const rootProps = {
    ...props.rootProps,
    manifest,
  }

  let pageRender
  if(!etatAuthentifie) {
    pageRender = <p>Attente de connexion</p>
  } else {
    // 3. Afficher application
    pageRender = <SectionContenu rootProps={rootProps}
                                 workers={props.workers}
                                 page={rootProps.page}
                                 paramsPage={rootProps.paramsPage}
                                 listeNoeuds={listeNoeuds}
                                 majNoeud={traiterMessageNoeudsCb} 
                                 etatAuthentifie={etatAuthentifie} />
  }

  return (
    <Container className="main-body">
      {pageRender}
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

export function Layout(props) {

  // Application independante (probablement pour DEV)
  return (
    <div className="flex-wrapper">
      <div>
        <Entete changerPage={props.changerPage}
                rootProps={props.rootProps} />
        {props.children}
      </div>
      <Footer rootProps={props.rootProps}/>
    </div>
  )

}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage} rootProps={props.rootProps}/>
    </Container>
  )
}

function Footer(props) {

  const idmg = props.idmg

  return (
    <Container>
      <Row>
        <Col>
          <div>
            <div>IDMG : {idmg}</div>
            <div>
              Senseurs Passifs pour MilleGrilles
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
