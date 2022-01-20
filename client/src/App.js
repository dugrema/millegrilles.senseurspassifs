import React, {Suspense, useState, useEffect, useCallback} from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import { proxy } from 'comlink'
import { Trans } from 'react-i18next'

import { LayoutApplication, HeaderApplication, FooterApplication, styles as stylesCommuns } from '@dugrema/millegrilles.reactjs'

import Menu from './Menu'
import { SectionContenu } from './SectionContenu'

import './App.css'

var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}

const manifest = manifestImport

// let _etatConnexion,
//     _setEtatConnexion,
//     _workers

const _contexte = {}  // Contexte global pour comlink proxy callbacks

function App(props) {
  const [workers, setWorkers] = useState('')
  const [usager, setUsager] = useState('')
  const [page, setPage] = useState('Accueil')
  const [paramsPage, setParamsPage] = useState('')
  const [etatConnexion, setEtatConnexion] = useState('')
  const [idmg, setIdmg] = useState('')

  // const setEtatConnexion = useCallback(etat => {
  //   setModeProtege(etat.protege)
  // }, [setModeProtege])

  // useEffect(
  //   _=>{
  //     _setEtatConnexion = comlinkProxy(setEtatConnexion)
  //     chargerWorkers(workers=>{
  //       console.debug("Workers charges : %O", workers)
  //     }).catch(err=>{console.error("Erreur preparation workers : %O", err)})
  //   },
  //   [setWorkers, setEtatConnexion, setNomUsager]
  // )

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
  }, [page, setPage, setParamsPage])


  // Chargement des proprietes et workers
  useEffect(()=>{
      importerWorkers(setWorkers)
        .then(()=>{ console.debug("Chargement de l'application complete") })
        .catch(err=>{console.error("Erreur chargement application : %O", err)})
  }, [setWorkers])

  useEffect(()=>{
    if(workers) {
      if(workers.connexion) {
        connecter(workers, setUsager, setEtatConnexion)
          .then(infoConnexion=>{console.debug("Info connexion : %O", infoConnexion)})
          .catch(err=>{console.debug("Erreur de connexion : %O", err)})
      }
    }
  }, [workers, setUsager, setEtatConnexion])

  useEffect(()=>{
    if(!etatConnexion) return 
    // workers.connexion.enregistrerCallbackMajFichier(proxy(data=>{
    //   // console.debug("callbackMajFichier data: %O", data)
    //   setEvenementFichier(data)
    // }))
    //   .catch(err=>{console.error("Erreur enregistrerCallbackMajFichier : %O", err)})
    // workers.connexion.enregistrerCallbackMajCollection(proxy(data=>{
    //   // console.debug("callbackMajCollection data: %O", data)
    //   setEvenementCollection(data)
    // }))
    //   .catch(err=>{console.error("Erreur enregistrerCallbackMajCollection : %O", err)})

    workers.chiffrage.getIdmgLocal().then(idmg=>{
      console.debug("IDMG local chiffrage : %O", idmg)
      setIdmg(idmg)
    })
  }, [etatConnexion, setIdmg])
    
  const rootProps = {
    usager, changerPage, page, paramsPage
  }

  // return <Layout
  //           changerPage={changerPage}
  //           page={page}
  //           rootProps={rootProps}
  //           idmg={idmg}>

  //           <ApplicationSenseursPassifs workers={workers}
  //                                       rootProps={rootProps} 
  //                                       etatConnexion={etatConnexion} />
  //        </Layout>

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

async function importerWorkers(setWorkers) {
  const { chargerWorkers } = await import('./workers/workerLoader')
  const workers = chargerWorkers()
  setWorkers(workers)
}

async function connecter(workers, setUsager, setEtatConnexion) {
  const { connecter: connecterWorker } = await import('./workers/connecter')
  return connecterWorker(workers, setUsager, setEtatConnexion)
}

function ApplicationSenseursPassifs(props) {

  // console.debug("!!! ApplicationSenseursPassifs Proppys : %O", props)

  const [listeNoeuds, setListeNoeuds] = useState('')

  const connexion = props.workers.connexion,
        etatConnexion = props.etatConnexion,
        modeProtege = etatConnexion?etatConnexion.protege:false

  const traiterMessageNoeudsHandler = useCallback(proxy(msg => {
    console.debug("Message noeuds recu : %O", msg)
    majNoeud(msg, _contexte.listeNoeuds, _contexte.setListeNoeuds)
  }), [])

  // Entretien du contexte global pour les callbacks comlink proxy
  useEffect(()=>{
    _contexte.listeNoeuds = listeNoeuds
    _contexte.setListeNoeuds = setListeNoeuds
  }, [listeNoeuds, setListeNoeuds])

  useEffect(()=>{
    if(connexion && modeProtege) {
      connexion.getListeNoeuds()
        .then(listeNoeuds=>{
          console.debug("Noeuds recus : %O", listeNoeuds)
          // Injecter partition dans les noeuds
          listeNoeuds.noeuds.forEach(n => {n.partition = listeNoeuds.partition})
          setListeNoeuds(listeNoeuds)
        })
        .catch(err=>{console.error("Erreur reception noeuds : %O", err)})

      if(traiterMessageNoeudsHandler) {
        connexion.ecouterEvenementsNoeuds(traiterMessageNoeudsHandler)
          .catch(err=>{console.error("Erreur ecouterEvenementsNoeuds: %O", err)})

        return ()=>{
          connexion.retirerEvenementsNoeuds()
        }
      }
    }
  }, [connexion, modeProtege, traiterMessageNoeudsHandler])

  const rootProps = {
    ...props.rootProps,
    modeProtege,
    manifest,
  }

  let pageRender
  if(!etatConnexion || !etatConnexion.protege) {
    pageRender = <p>Attente de connexion</p>
  } else {
    // 3. Afficher application
    pageRender = <SectionContenu rootProps={rootProps}
                                 workers={props.workers}
                                 page={rootProps.page}
                                 paramsPage={rootProps.paramsPage}
                                 listeNoeuds={listeNoeuds}
                                 majNoeud={traiterMessageNoeudsHandler} />
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

  const noeud_id = message.noeud_id

  var trouve = false
  const noeudsMaj = listeNoeuds.noeuds.map(noeud=>{
    if(noeud.noeud_id === noeud_id) {
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

function Contenu(props) {
  return (
    <Container className="main-body">
      {props.page}
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

// function Menu(props) {

//   let boutonProtege
//   if(props.rootProps.modeProtege) {
//     boutonProtege = <i className="fa fa-lg fa-lock protege"/>
//   } else {
//     boutonProtege = <i className="fa fa-lg fa-unlock"/>
//   }

//   return (
//     <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
//       <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
//       <Navbar.Toggle aria-controls="responsive-navbar-menu" />
//       <Navbar.Collapse id="responsive-navbar-menu">

//         <MenuItems changerPage={props.changerPage}/>

//         <Nav className="justify-content-end">
//           <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
//           <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
//         </Nav>
//       </Navbar.Collapse>
//     </Navbar>
//   )
// }

// export function MenuItems(props) {

//   const changerPage = event => {
//     props.changerPage(event)
//   }

//   return (
//     <Nav className="mr-auto" activeKey={props.section} onSelect={changerPage}>

//       <Nav.Item>
//         <Nav.Link eventKey='Accueil'>
//           <Trans>menu.Accueil</Trans>
//         </Nav.Link>
//       </Nav.Item>

//     </Nav>
//   )

// }
