import React, {useState, useEffect, useCallback} from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'
import { Trans } from 'react-i18next'

import { VerificationInfoServeur } from './Authentification'
import { SectionContenu } from './SectionContenu'

import {setupWorkers, preparerWorkersAvecCles} from './workers/workers.load'

// import './App.css'

// import manifest from '../../../manifest.build.js'
var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}
// try {
//   manifestImport = require('../../../manifest.build.js')
// } catch(err) {
//   // Ok
// }
const manifest = manifestImport

let _etatConnexion,
    _setEtatConnexion,
    _workers

const _contexte = {}  // Contexte global pour comlink proxy callbacks

// const ROUTING_KEYS_NOEUDS = [
//   'transaction.SenseursPassifs.*.majNoeud',
//   'transaction.SenseursPassifs.majNoeud',
// ]

export default function App(props) {
  const [modeProtege, setModeProtege] = useState(false)
  const [workers, setWorkers] = useState('')
  const [nomUsager, setNomUsager] = useState('')
  const [page, setPage] = useState('Accueil')
  const [paramsPage, setParamsPage] = useState('')

  const setEtatConnexion = useCallback(etat => {
    // console.debug("Callback setEtatConnexion (etat protege) : %s", etat)
    setModeProtege(etat)
  }, [setModeProtege])

  useEffect(
    _=>{
      _setEtatConnexion = comlinkProxy(setEtatConnexion)
      preparerWorkers(setWorkers, _setEtatConnexion, setNomUsager)
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

    // if(infoIdmg.idmg) setIdmg(infoIdmg.idmg)  // Note : il serait preferable de calculer le idmg avec x509Worker
    // if(infoIdmg.nomUsager) setNomUsager(infoIdmg.nomUsager)

    // Indique a l'application que les workers sont prets
    setWorkers({
      connexion: connexionWorker,
      chiffrage: chiffrageWorker,
      x509: x509Worker,
    })
  }
}

function ApplicationSenseursPassifs(props) {

  // state = {
  //   serveurInfo: null,          // Provient de /coupdoeil/info.json
  //   idmg: null,                 // IDMG actif
  //   hebergement: false,
  //
  //   websocketApp: '',
  //
  //   noeuds: [],
  //   paramsPage: {},
  //
  //   page: 'Accueil',
  // }

  const [noeuds, setNoeuds] = useState('')

  const connexion = props.workers.connexion,
        modeProtege = props.rootProps.modeProtege

  // Entretien du contexte global pour les callbacks comlink proxy
  useEffect(()=>{
    _contexte.noeuds = noeuds
    _contexte.setNoeuds = setNoeuds
  }, [noeuds, setNoeuds])

  useEffect(()=>{
    if(connexion && modeProtege) {
      connexion.getListeNoeuds()
        .then(noeuds=>{
          console.debug("Noeuds recus : %O", noeuds)
          setNoeuds(noeuds)
        })
        .catch(err=>{console.error("Erreur reception noeuds : %O", err)})
    }
  }, [connexion, modeProtege])

  // componentDidMount() {
  //
  //   const wsa = this.props.rootProps.connexionWorker
  //   wsa.isFormatteurReady()
  //     .then( async _ =>{
  //       console.debug("Formatteur ready sur connexion, fetch fichiers")
  //       this.setState({websocketApp: wsa})
  //
  //       // wsa.subscribe(ROUTING_KEYS_NOEUDS, this.majNoeud, {DEBUG: true, exchange: ['2.prive', '3.protege']})
  //
  //       const noeuds = await wsa.getListeNoeuds()
  //       console.debug("Liste noeuds : %O", noeuds)
  //       this.setState({noeuds})
  //     })
  //
  //   this.props.setSousMenuApplication(
  //     <MenuItems
  //       changerPage={this.changerPage}
  //       websocketApp={wsa}
  //       />
  //   )
  //
  // }

  // componentWillUnmount() {
  //   const wsa = this.state.websocketApp
  //   wsa.unsubscribe(ROUTING_KEYS_NOEUDS, this.majNoeud, {exchange: ['2.prive', '3.protege']})
  // }

  const majNoeud = useCallback(comlinkProxy(msg => {
    console.debug("MAJ noeud recue\n%O", msg)
    majNoeud(msg, _contexte.noeuds, _contexte.setNoeuds)
  }), [_contexte])

  // toggleProtege = async event => {
  //   const modeToggle = ! this.state.modeProtege
  //   if(modeToggle) {
  //     // console.debug("Activer mode protege")
  //
  //     if(this.state.websocketApp) {
  //       try {
  //         await this.state.websocketApp.demandeActiverModeProtege()
  //         this.setState({modeProtege: true})
  //       } catch(err) {
  //         console.error("Erreur activation mode protege")
  //         console.error(err)
  //       }
  //     } else {
  //       console.error("Connexion Socket.IO absente")
  //     }
  //
  //   } else {
  //     this.desactiverProtege()
  //   }
  //
  // }

  // desactiverProtege = () => {
  //   // console.debug("Revenir a mode prive")
  //   if(this.state.websocketApp) {
  //     // this.state.websocketApp.desactiverModeProtege()
  //   }
  //   this.setState({modeProtege: false})
  // }

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
                                 noeuds={noeuds} />
  }

  return pageRender

}

function majNoeud(evenement, noeuds, setNoeuds) {
  const {message, exchange} = evenement

  const noeud_id = message.noeud_id

  var trouve = false
  const noeudsMaj = noeuds.map(noeud=>{
    if(noeud.noeud_id === noeud_id) {
      trouve = true
      var copieNoeud = Object.assign({}, noeud)
      copieNoeud = Object.assign(copieNoeud, message)
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

  // <span title={props.rootProps.manifest.date}>
  //   <Trans values={{version: props.rootProps.manifest.version}}>application.coupdoeilVersion</Trans>
  // </span>

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
