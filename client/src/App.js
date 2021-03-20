import React from 'react'
import {proxy as comlinkProxy} from 'comlink'

import { VerificationInfoServeur } from './Authentification'
import { SectionContenu } from './SectionContenu'
import { MenuItems } from './Menu'

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

const ROUTING_KEYS_NOEUDS = [
  'transaction.SenseursPassifs.*.majNoeud',
  'transaction.SenseursPassifs.majNoeud',
]

export class ApplicationSenseursPassifs extends React.Component {

  listenersNoeuds = []

  state = {
    serveurInfo: null,          // Provient de /coupdoeil/info.json
    idmg: null,                 // IDMG actif
    hebergement: false,

    websocketApp: '',

    noeuds: [],
    paramsPage: {},

    page: 'Accueil',
  }

  componentDidMount() {

    const wsa = this.props.rootProps.connexionWorker
    wsa.isFormatteurReady()
      .then( async _ =>{
        console.debug("Formatteur ready sur connexion, fetch fichiers")
        this.setState({websocketApp: wsa})

        wsa.subscribe(ROUTING_KEYS_NOEUDS, this.majNoeud, {DEBUG: true, exchange: ['2.prive', '3.protege']})

        const noeuds = await wsa.getListeNoeuds()
        console.debug("Liste noeuds : %O", noeuds)
        this.setState({noeuds})
      })

    this.props.setSousMenuApplication(
      <MenuItems
        changerPage={this.changerPage}
        websocketApp={wsa}
        />
    )

  }

  componentWillUnmount() {
    const wsa = this.state.websocketApp
    wsa.unsubscribe(ROUTING_KEYS_NOEUDS, this.majNoeud, {exchange: ['2.prive', '3.protege']})
  }

  majNoeud = comlinkProxy(msg => {
    // console.debug("MAJ noeud recue\n%O", msg)
    majNoeud(msg.message, msg.exchange, this.state.noeuds, state=>{this.setState(state)})
  })

  setInfoServeur = (info) => {
    this.setState(info)
  }

  changerPage = eventPage => {
    // Verifier si event ou page
    let page
    var paramsPage = null
    if(eventPage.currentTarget) {
      var target = eventPage.currentTarget
      page = target.value
      var dataset = target.dataset
      if(dataset) {
        paramsPage = {...dataset}
      }
    } else {
      page = eventPage
    }

    if(page === this.state.page) {
      // Reset de la page
      // console.debug("Reset page : %s", page)
      this.setState({page: '', paramsPage}, ()=>{this.setState({page})})
    } else {
      // console.debug("Page : %s", page)
      this.setState({page, paramsPage})
    }
  }

  toggleProtege = async event => {
    const modeToggle = ! this.state.modeProtege
    if(modeToggle) {
      // console.debug("Activer mode protege")

      if(this.state.websocketApp) {
        try {
          await this.state.websocketApp.demandeActiverModeProtege()
          this.setState({modeProtege: true})
        } catch(err) {
          console.error("Erreur activation mode protege")
          console.error(err)
        }
      } else {
        console.error("Connexion Socket.IO absente")
      }

    } else {
      this.desactiverProtege()
    }

  }

  desactiverProtege = () => {
    // console.debug("Revenir a mode prive")
    if(this.state.websocketApp) {
      // this.state.websocketApp.desactiverModeProtege()
    }
    this.setState({modeProtege: false})
  }

  render() {

    const rootProps = {
      ...this.props,
      ...this.props.rootProps,
      ...this.state,
      manifest,
      changerPage: this.changerPage,
      majNoeud: message=>{this.majNoeud({message})}
    }

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <p>Attente de connexion</p>
    } else {
      // 3. Afficher application
      page = <SectionContenu rootProps={rootProps} />
    }

    return page
  }

}

function majNoeud(message, exchange, noeuds, setState) {
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

  setState({noeuds: noeudsMaj})
}
