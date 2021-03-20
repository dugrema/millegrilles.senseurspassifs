import React from 'react'
import { Row, Col, Button, Form, Alert } from 'react-bootstrap';

import { ConfigurationBlynk, ConfigurationLCD } from './NoeudConfigModules'
import { Senseurs } from './NoeudConfigSenseurs'

const routingKeysNoeud = [
  'transaction.SenseursPassifs.*.majSenseur',
  'transaction.SenseursPassifs.majSenseur',
  'evenement.SenseursPassifs.*.lecture',
  'evenement.SenseursPassifs.lecture'
]

export class Noeud extends React.Component {

  listeners = []

  state = {
    senseurs: [],
    erreur: '',
    confirmation: '',
  }

  componentDidMount() {
    const wsa = this.props.rootProps.websocketApp
    const noeud_id = this.props.rootProps.paramsPage.noeud_id
    chargerSenseurs(wsa, params=>{this.setState(params)}, noeud_id)
    wsa.subscribe(routingKeysNoeud, this.messageRecu, {exchange: '2.prive'})
    wsa.subscribe(routingKeysNoeud, this.messageRecu, {exchange: '3.protege'})
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp
    wsa.unsubscribe(routingKeysNoeud, this.messageRecu, {exchange: '2.prive'})
    wsa.unsubscribe(routingKeysNoeud, this.messageRecu, {exchange: '3.protege'})
  }

  setErreur = erreur => {
    this.setState({erreur})
  }

  setConfirmation = confirmation => {
    this.setState({confirmation})
  }

  messageRecu = message => {
    // console.debug("Message recu :\n%O", message)
    var splitKey = message.routingKey.split('.')
    const action = splitKey[splitKey.length-1]

    if(action === 'lecture') {
      const noeudId = this.props.rootProps.paramsPage.noeud_id
      const noeudIdRecu = message.message.noeud_id
      // console.debug("Lecture recue : %O", message.message)
      if(noeudId === noeudIdRecu) {
        this.traiterLecture(message.message, message.exchange, this.state.senseurs, param=>{this.setState(param)})
      }
    }
  }

  traiterLecture = (message, exchange) => {
    traiterLecture(message, exchange, this.state.senseurs, param=>{this.setState(param)})
  }

  changerSecurite = async event => {
    const {value} = event.currentTarget
    const wsa = this.props.rootProps.websocketApp
    const noeud_id = this.props.rootProps.paramsPage.noeud_id

    this.setErreur()

    try {
      const reponse = await wsa.changerSecuriteNoeud(noeud_id, value)
      console.debug("Reponse commande changer securite\n%O", reponse)
      this.props.rootProps.majNoeud(reponse)
    } catch(err) {
      this.setErreur(''+err)
    }
  }

  render() {

    const noeud_id = this.props.rootProps.paramsPage.noeud_id

    const noeud = this.props.rootProps.noeuds.filter(noeud=>{
      return noeud.noeud_id === noeud_id
    })[0] // Filtrer, garder premier element

    var erreur = '', confirmation = ''
    if(this.state.erreur) {
      erreur = (
        <Alert variant="danger" dismissible onClose={_=>this.setErreur()}>
          {this.state.erreur}
        </Alert>
      )
    }
    if(this.state.confirmation) {
      confirmation = (
        <Alert variant="success" dismissible onClose={_=>this.setConfirmation()}>
          {this.state.confirmation}
        </Alert>
      )
    }

    return (
      <div>
        <h1>Noeud</h1>
        {erreur}
        {confirmation}
        <AfficherInformationNoeud rootProps={this.props.rootProps}
                                  noeud={noeud} senseurs={this.state.senseurs}
                                  changerSecurite={this.changerSecurite}
                                  setErreur={this.setErreur}
                                  majNoeud={this.props.rootProps.majNoeud}
                                  setConfirmation={this.setConfirmation} />
      </div>
    )
  }
}

class AfficherInformationNoeud extends React.Component {

  state = {
    descriptif: '',
    senseursModeEdition: {},  // Senseurs en mode d'edition. cle : uuid, valeur : true
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  changerNomNoeud = async _ => {
    console.debug("Changer nom noeud : %s", this.state.descriptif)

    if(!this.state.descriptif) {
      this.props.setErreur("Veuillez ajouter/modifier le nom du noeud")
      return
    }

    const wsa = this.props.rootProps.websocketApp
    const noeud_id = this.props.rootProps.paramsPage.noeud_id

    try {
      wsa.changerNomNoeud(noeud_id, this.state.descriptif)
      this.props.majNoeud({noeud_id, descriptif: this.state.descriptif})
      this.props.setConfirmation("Nom du noeud change.")
    } catch (err) {
      this.props.setErreur(''+err)
    }
  }

  setModeEdition = (uuidSenseur, estEdition) => {
    const senseursModeEdition = {...this.state.senseursModeEdition}
    if(estEdition) {
      senseursModeEdition[uuidSenseur] = true
    } else {
      delete senseursModeEdition[uuidSenseur]
    }
    this.setState({senseursModeEdition})
  }

  render() {
    const noeud = this.props.noeud

    const blynkActif = noeud.blynk_actif || false

    return (
      <div className="config-page">
        <Row>
          <Col md={2} className="label">Nom</Col>
          <Col md={7}>
            <Form.Group controlId="nomNoeud">
              <Form.Control type="text"
                            name="descriptif"
                            onChange={this.changerChamp}
                            value={this.state.descriptif || noeud.descriptif || ''}
                            placeholder="Mettre un nom pour le noeud ..."
                            disabled={!this.props.rootProps.modeProtege} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Button onClick={this.changerNomNoeud}
                    variant="secondary"
                    disabled={!this.props.rootProps.modeProtege}>Changer nom</Button>
          </Col>
        </Row>
        <Row>
          <Col md={2} className="label">Noeud Id</Col>
          <Col>{noeud.noeud_id}</Col>
        </Row>
        <Row>
          <Col md={2} className="label">Securite</Col>
          <Col md={2}>{noeud.securite}</Col>
          <Col md={8}>
            <Button variant="success"
                    disabled={noeud.securite==='3.protege' || !this.props.rootProps.modeProtege}
                    onClick={this.props.changerSecurite}
                    value="3.protege">Protege</Button>
            <Button variant="dark"
                    disabled={noeud.securite==='2.prive' || !this.props.rootProps.modeProtege}
                    onClick={this.props.changerSecurite}
                    value="2.prive">Prive</Button>
            <Button variant="danger"
                    disabled={noeud.securite==='1.public' || !this.props.rootProps.modeProtege}
                    onClick={this.props.changerSecurite}
                    value="1.public">Public</Button>
          </Col>
        </Row>

        <ConfigurationBlynk noeud={noeud}
                            rootProps={this.props.rootProps}
                            setErreur={this.props.setErreur}
                            setConfirmation={this.props.setConfirmation} />

        <ConfigurationLCD noeud={noeud}
                          blynkActif={blynkActif}
                          rootProps={this.props.rootProps}
                          setErreur={this.props.setErreur}
                          setConfirmation={this.props.setConfirmation} />

        <Senseurs senseurs={this.props.senseurs}
                  noeud={noeud}
                  rootProps={this.props.rootProps}
                  setErreur={this.props.setErreur}
                  traiterLecture={this.props.traiterLecture}
                  setConfirmation={this.props.setConfirmation}
                  setModeEdition={this.setModeEdition}
                  senseursModeEdition={this.state.senseursModeEdition}
                  blynkActif={blynkActif} />
      </div>
    )
  }
}

async function chargerSenseurs(wsa, setState, noeud_id) {
  const senseurs = await wsa.getListeSenseursNoeud(noeud_id)
  // console.debug("Senseurs:\n%O", senseurs)
  setState({senseurs})
}

function traiterLecture(message, exchange, senseurs, setState) {
  const uuid_senseur = message.uuid_senseur

  // console.debug("Lecture recue :\n%O", message)

  var trouve = false
  const copieSenseurs = senseurs.map(senseurExistant=>{
    if(senseurExistant.uuid_senseur === uuid_senseur) {
      trouve = true
      // Remplacer le senseur
      const copieSenseur = Object.assign({}, senseurExistant)
      // copieSenseur.senseurs = message.senseurs

      // Remplacer chaque lecture de senseur
      // Conserver les donnees non-inclues dans la transaction (e.g. vpin blynk)
      for(let nomApp in message.senseurs) {
        var lectureExistante = copieSenseur.senseurs[nomApp]
        var copieApp = {nouveau: true}  // Par defaut, nouveau
        if(lectureExistante) {
          copieApp = Object.assign({}, lectureExistante)
        }
        // Remplacer donnees maj dans la lecture copiee
        copieApp = Object.assign(copieApp, message.senseurs[nomApp])
        copieSenseur.senseurs[nomApp] = copieApp
      }

      copieSenseur['_mg-derniere-modification'] = message['en-tete'].estampille

      // console.debug("Copie du senseur maj :\n%O", copieSenseur)

      return copieSenseur
    }
    return senseurExistant
  })

  if(!trouve) {
    // Ajouter le senseur a la liste
    if(!message.securite) message.securite = exchange
    message.nouveau = true
    copieSenseurs.push(message)
  }

  // console.debug("Nouvelle liste senseurs :\n%O", copieSenseurs)

  setState({senseurs: copieSenseurs})
}