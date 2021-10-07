import React, {useState, useEffect, useCallback} from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'
import { Trans } from 'react-i18next'

import { SectionContenu } from './SectionContenu'

import {setupWorkers, preparerWorkersAvecCles} from './workers/workers.load'

var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}

const manifest = manifestImport

let _etatConnexion,
    _setEtatConnexion,
    _workers

const _contexte = {}  // Contexte global pour comlink proxy callbacks

export default function App(props) {
  const [modeProtege, setModeProtege] = useState(false)
  const [workers, setWorkers] = useState('')
  const [nomUsager, setNomUsager] = useState('')
  const [page, setPage] = useState('Accueil')
  const [paramsPage, setParamsPage] = useState('')

  const setEtatConnexion = useCallback(etat => {
    setModeProtege(etat)
  }, [setModeProtege])

  useEffect(
    _=>{
      _setEtatConnexion = comlinkProxy(setEtatConnexion)
      preparerWorkers(setWorkers, _setEtatConnexion, setNomUsager)
        .catch(err=>{console.error("Erreur preparation workers : %O", err)})
    },
    [setWorkers, setEtatConnexion, setNomUsager]
  )

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


  const rootProps = {
    nomUsager, modeProtege, changerPage, page, paramsPage
  }

  return <Layout
            changerPage={changerPage}
            page={page}
            rootProps={rootProps}>

            <ApplicationSenseursPassifs workers={workers}
                                        rootProps={rootProps} />
         </Layout>

}

async function preparerWorkers(setWorkers, setEtatConnexion, setNomUsager) {
  if(!_workers && setEtatConnexion && setNomUsager) {
    const workers = await setupWorkers()
    console.debug("Workers charges : %O", workers)
    _workers = workers  // Conserver globalement, utilise pour callbacks

    const {connexion, chiffrage, x509} = workers
    const connexionWorker = connexion.connexionWorker,
          chiffrageWorker = chiffrage.chiffrageWorker,
          x509Worker = x509.x509Worker

    const _preparerWorkersAvecCles = async nomUsager => {
      console.debug("Preparation workers avec cle de l'usager %s", nomUsager)
      setNomUsager(nomUsager)
      await preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker, x509Worker)
      console.debug("preparerWorkersAvecCles pret pour l'usager %s", nomUsager)
    }

    console.debug("Set callbacks connexion worker")
    await connexionWorker.setCallbacks(
      comlinkProxy(setEtatConnexion),
      x509Worker,
      comlinkProxy(_preparerWorkersAvecCles)
    )

    /* Helper pour connecter le worker avec socketIo.
       - connexionWorker : proxu de connexionWorker deja initialise
       - app : this d'une classe React */
    const opts = {location: window.location.href}
    console.debug("Connexion a socket.io avec %O", opts)
    const infoIdmg = await connexionWorker.connecter(opts)
    console.debug("Connexion socket.io completee, info idmg : %O", infoIdmg)

    // Indique a l'application que les workers sont prets
    setWorkers({
      connexion: connexionWorker,
      chiffrage: chiffrageWorker,
      x509: x509Worker,
    })
  }
}

function ApplicationSenseursPassifs(props) {

  const [listeNoeuds, setListeNoeuds] = useState('')

  const connexion = props.workers.connexion,
        modeProtege = props.rootProps.modeProtege

  const traiterMessageNoeudsHandler = useCallback(comlinkProxy(msg => {
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
    manifest,
  }

  let pageRender
  if(!props.rootProps.modeProtege) {
    pageRender = <p>Attente de connexion</p>
  } else {
    // 3. Afficher application
    pageRender = <SectionContenu rootProps={rootProps}
                                 workers={props.workers}
                                 page={rootProps.page}
                                 paramsPage={rootProps.paramsPage}
                                 listeNoeuds={listeNoeuds} />
  }

  return pageRender

}

function majNoeud(evenement, listeNoeuds, setNoeuds) {
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
    if(!message.securite) message.securite = exchange
    noeudsMaj.push(message)
  }

  setNoeuds(noeudsMaj)
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

  const idmg = props.rootProps.idmg
  var qrCode = 'QR'

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>IDMG : {idmg}</div>
            <div>
              <Trans>application.coupdoeilAdvert</Trans>{' '}
            </div>
          </div>
        </Col>
        <Col sm={2} className="footer-right">{qrCode}</Col>
      </Row>
    </Container>
  )
}

function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">

        <MenuItems changerPage={props.changerPage}/>

        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export function MenuItems(props) {

  const changerPage = event => {
    props.changerPage(event)
  }

  return (
    <Nav className="mr-auto" activeKey={props.section} onSelect={changerPage}>

      <Nav.Item>
        <Nav.Link eventKey='Accueil'>
          <Trans>menu.Accueil</Trans>
        </Nav.Link>
      </Nav.Item>

    </Nav>
  )

}
