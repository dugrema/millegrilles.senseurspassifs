import React from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import openSocket from 'socket.io-client'
import {proxy as comlinkProxy} from 'comlink'

import { Trans } from 'react-i18next';

import {getCertificats, getClesPrivees} from './components/pkiHelper'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'
import {setupWorkers, cleanupWorkers, preparerWorkersAvecCles} from './workers/workers.load'

import { ApplicationSenseursPassifs } from './App'

//import manifest from '../manifest.build.js'
const manifest = {
  date: "DUMMY",
  version: "DUMMY",
}

export default class AppTopLevel extends React.Component {

  state = {
    //websocketApp: null,         // Connexion socket.io
    modeProtege: false,         // Mode par defaut est lecture seule (prive)
    sousMenuApplication: null,
    connexionSocketIo: null,
  }

  componentDidMount() {
    setupWorkers(this).then( async _ =>{
      console.debug("Workers charges, info session : %O, proppys : %O", this.state, this.props)

      this.setState({
        signateurTransaction: {preparerTransaction: this.state.chiffrageWorker.formatterMessage}, // Legacy
      })

      await this.preparerWorkersAvecCles()
      this.toggleProtege()  // Tenter upgrade protege automatiquement
    })

  }

  componentWillUnmount() {
    cleanupWorkers(this)
  }

  toggleProtege = async () => {
    if( this.state.modeProtege ) {
      // Desactiver mode protege
      this.state.connexionWorker.downgradePrive()
    } else {
      // Activer mode protege, upgrade avec certificat (implicite)
      console.debug("toggleProtege")
      try {
        const resultat = await this.state.connexionWorker.upgradeProteger()
      } catch(err) {
        console.error("BIARE! %O", err)
      }
    }
  }

  async preparerWorkersAvecCles() {
    const {nomUsager, chiffrageWorker, connexionWorker} = this.state
    await preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker)

    // // Initialiser certificat de MilleGrille et cles si presentes
    // const certInfo = await getCertificats(nomUsager)
    // if(certInfo && certInfo.fullchain) {
    //   const fullchain = splitPEMCerts(certInfo.fullchain)
    //   const clesPrivees = await getClesPrivees(nomUsager)
    //
    //   // Initialiser le CertificateStore
    //   await chiffrageWorker.initialiserCertificateStore([...fullchain].pop(), {isPEM: true, DEBUG: false})
    //   console.debug("Certificat : %O, Cles privees : %O", certInfo.fullchain, clesPrivees)
    //
    //   // Initialiser web worker
    //   await chiffrageWorker.initialiserFormatteurMessage({
    //     certificatPem: certInfo.fullchain,
    //     clePriveeSign: clesPrivees.signer,
    //     clePriveeDecrypt: clesPrivees.dechiffrer,
    //     DEBUG: true
    //   })
    //
    //   await connexionWorker.initialiserFormatteurMessage({
    //     certificatPem: certInfo.fullchain,
    //     clePriveeSign: clesPrivees.signer,
    //     clePriveeDecrypt: clesPrivees.dechiffrer,
    //     DEBUG: true
    //   })
    // } else {
    //   throw new Error("Pas de cert")
    // }
  }

  deconnexionSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO deconnecte : %O", event)
    this.setState({modeProtege: false})
  })

  reconnectSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO reconnecte : %O", event)
    if(!this.state.modeProtege) {
      this.toggleProtege()
    }
  })

  setEtatProtege = comlinkProxy(reponse => {
    console.debug("Callback etat protege : %O", reponse)
    const modeProtege = reponse.etat
    console.debug("Toggle mode protege, nouvel etat : %O", reponse)
    this.setState({modeProtege})
  })

  setSousMenuApplication = sousMenuApplication => {
    console.debug("Set sous-menu application")
    this.setState({sousMenuApplication})
  }

  // setWebsocketApp = websocketApp => {
  //   // Set la connexion Socket.IO. Par defaut, le mode est prive (lecture seule)
  //   this.setState({websocketApp, modeProtege: false})
  // }

  // setConnexionSocketIo = connexionSocketIo => {
  //   this.setState({connexionSocketIo})
  // }

  render() {

    const rootProps = {...this.state, manifest, toggleProtege: this.toggleProtege}

    let page;
    if(!this.state.nomUsager || !this.state.connexionWorker) {
      // Connecter avec Socket.IO
      page = <p>Chargement en cours</p>
    } else {
      // 3. Afficher application
      page = <ApplicationSenseursPassifs setSousMenuApplication={this.setSousMenuApplication} rootProps={{...this.state}} />
    }

    return <Layout
              changerPage={this.changerPage}
              page={page}
              rootProps={rootProps}
              sousMenuApplication={this.state.sousMenuApplication}
              appProps={this.props} />
  }

}

export class ConnexionWebsocket extends React.Component {

  state = {
    erreur: false,
    erreurMessage: '',
  }

  componentDidMount() {
    this.authentifier()
  }

  async authentifier() {
    const connexionSocketIo = openSocketHelper()
    this.props.setConnexionSocketIo(connexionSocketIo)

    // const config = {
    //   path: '/coupdoeil/socket.io',
    //   reconnection: true,
    // }
    // const websocketConnexion = new WebSocketManager(config)
    // websocketConnexion.disconnectHandler = this.props.desactiverProtege
    //
    // try {
    //   await websocketConnexion.connecter()
    //   this.props.setWebsocketApp(websocketConnexion)
    //   console.debug("Authentification completee")
    // } catch(err) {
    //   console.error("Erreur authentification")
    //   console.error(err)
    //   this.setState({erreur: true, erreurMessage: err.cause})
    // }

  }

  render() {
    let page;
    if(this.state.erreur) {
      page = <p>Erreur : {this.state.erreurMessage}</p>
    } else {
      page = <p>Connexion a Socket.IO de Coup D'Oeil en cours ...</p>
    }

    return page
  }
}

export class Layout extends React.Component {

  render() {
    // Application independante (probablement pour DEV)
    return (
      <div className="flex-wrapper">
        <div>
          <Entete changerPage={this.props.changerPage}
                  sousMenuApplication={this.props.sousMenuApplication}
                  rootProps={this.props.rootProps} />
          <Contenu page={this.props.page}/>
        </div>
        <Footer rootProps={this.props.rootProps}/>
      </div>
    )
  }
}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage} sousMenuApplication={props.sousMenuApplication} rootProps={props.rootProps}/>
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
              <span title={props.rootProps.manifest.date}>
                <Trans values={{version: props.rootProps.manifest.version}}>application.coupdoeilVersion</Trans>
              </span>
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

  var menuItems = props.sousMenuApplication

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        {menuItems}
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

// export function MenuItems(props) {
//   return (
//     <Nav className="mr-auto" activeKey={props.section} onSelect={props.changerPage}>
//       <Nav.Item>
//         <Nav.Link eventKey='Principale'>
//           <Trans>menu.Principal</Trans>
//         </Nav.Link>
//       </Nav.Item>
//       <Dropdown as={NavItem}>
//         <Dropdown.Toggle as={NavLink}><Trans>menu.Parametres</Trans></Dropdown.Toggle>
//         <Dropdown.Menu>
//           <Dropdown.Item eventKey="Parametres"><Trans>menu.Parametres</Trans></Dropdown.Item>
//           <Dropdown.Item eventKey="Backup"><Trans>menu.Backup</Trans></Dropdown.Item>
//           <Dropdown.Item eventKey="Hebergement"><Trans>menu.Hebergement</Trans></Dropdown.Item>
//           <Dropdown.Item eventKey="Pki"><Trans>menu.Pki</Trans></Dropdown.Item>
//         </Dropdown.Menu>
//       </Dropdown>
//     </Nav>
//   )
// }

function openSocketHelper() {
  let socket = openSocket('/', {
    path: '/senseurspassifs/socket.io',
    reconnection: true,
    reconnectionAttempts: 30,
    reconnectionDelay: 500,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5
  })

  return socket;
}
