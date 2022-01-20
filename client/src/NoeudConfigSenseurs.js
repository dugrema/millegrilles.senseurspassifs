import React from 'react'
import { Container, Row, Col, Button, Form, Card, CardGroup } from 'react-bootstrap';

import { DateTimeAfficher } from './components/ReactFormatters'

export function Senseurs(props) {

  var senseurs = null
  if(props.listeSenseurs) {
    // console.debug("Senseurs : %O", props.listeSenseurs)
    senseurs = props.listeSenseurs.map(senseur=>{
      return <Senseur key={senseur.uuid_senseur}
                      noeud={props.noeud}
                      senseur={senseur}
                      rootProps={props.rootProps}
                      workers={props.workers}
                      setErreur={props.setErreur}
                      setConfirmation={props.setConfirmation}
                      setModeEdition={props.setModeEdition}
                      senseursModeEdition={props.senseursModeEdition} />
    })
  }

  return (
    <div>
      <h2>Senseurs</h2>
      <CardGroup>
        {senseurs}
      </CardGroup>
    </div>
  )
}

class Senseur extends React.Component {

  state = {
    descriptif: '',
    blynkVPins: {},
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  // sauvegarderNom = async _ => {
  //   const wsa = this.props.workers.connexion
  //
  //   // Aucun nom
  //   if(!this.state.descriptif) {
  //     this.props.setErreur("Veuillez ajouter/modifier le nom")
  //     return
  //   }
  //
  //   const descriptif = this.state.descriptif,
  //         uuid_senseur = this.props.senseur.uuid_senseur
  //
  //   try {
  //     let reponse = await wsa.majSenseur(this.state.noeud.partition, {uuid_senseur, descriptif})
  //     console.debug("Reponse majSenseur : %O", reponse)
  //     this.props.setConfirmation('Senseur mis a jour')
  //   } catch(err) {
  //     this.props.setErreur(''+err)
  //   }
  // }

  sauvegarderSenseur = async _ => {
    console.debug("sauvegarderSenseur proppys : %O", this.props)
    const wsa = this.props.workers.connexion

    const uuid_senseur = this.props.senseur.uuid_senseur,
          partition = this.props.noeud.partition,
          noeud_id = this.props.noeud.noeud_id
    const transaction = {uuid_senseur, noeud_id}

    let changement = false

    if(this.state.descriptif && this.state.descriptif !== this.props.senseur.descriptif) {
      // Sauvegarder le nom du senseu
      transaction.descriptif = this.state.descriptif
      changement = true
    }

    if(changement) {
      console.debug("Sauvegarder changement senseur sur partition: %s, transaction: %O", partition, transaction)
      let reponse = await wsa.majSenseur(partition, transaction)
      console.debug("Reponse majSenseur : %O", reponse)
    }

    // this.setState({descriptif: ''})
    this.props.setModeEdition(this.props.senseur.uuid_senseur, false)
  }

  activerModeEdition = event => {
    this.props.setModeEdition(this.props.senseur.uuid_senseur, true)
  }

  annulerEdition = event => {
    this.props.setModeEdition(this.props.senseur.uuid_senseur, false)
  }

  render() {
    const senseur = this.props.senseur
    var descriptif = this.state.descriptif || senseur.descriptif || ''
    var uuidSenseur = senseur.uuid_senseur
    var modeEdition = this.props.senseursModeEdition[uuidSenseur]?true:false

    const timestampExpire = new Date().getTime() / 1000 - 300  // Expiration 5 minutes

    var apps = ''
    if(senseur && senseur.senseurs) {
      apps = Object.keys(senseur.senseurs).map(nomApp=>{
        const app = senseur.senseurs[nomApp]
        return <AfficherAppareil key={senseur.uuid_senseur + '/' + nomApp}
                                 senseurs={this.props.senseur.senseurs}
                                 app={app} nomApp={nomApp}
                                 noeud={this.props.noeud}
                                 changerVPin={this.changerVPin}
                                 timestampExpire={timestampExpire}
                                 modeEdition={modeEdition} />
      })
    }

    // Calculer plus recente lecture pour le senseur complet
    var timestampSenseur = ''
    if(senseur.senseurs) {
      timestampSenseur = Object.values(senseur.senseurs).map(item=>item.timestamp).reduce((acc, item)=>{
        if(item > acc) return item
        return acc
      }, 0)
    }

    var rowUuid = ''
    if(descriptif) {
      rowUuid = (
        <p className="card-senseur-uuid">UUID : {senseur.uuid_senseur}</p>
      )
    }

    var boutonsHeader = ''
    if(modeEdition) {
      boutonsHeader = (
        <>
          <Button onClick={this.sauvegarderSenseur}
                  variant="secondary"
                  disabled={!this.props.rootProps.modeProtege}>
            <i className="fa fa-check" title="Sauvegarder"/>
          </Button>
          <Button onClick={this.annulerEdition}
                  variant="secondary">
            <i className="fa fa-remove" title="Annuler"/>
          </Button>
        </>
      )
    } else {
      boutonsHeader = (
        <Button onClick={this.activerModeEdition}
                variant="secondary"
                disabled={!this.props.rootProps.modeProtege}>
          <i className="fa fa-edit" title="Editer"/>
        </Button>
      )
    }

    var titre = descriptif || senseur.uuid_senseur
    if(modeEdition) {
      titre = (
        <Form.Control type="text"
                      name="descriptif"
                      onChange={this.changerChamp}
                      value={descriptif} />
      )
    }

    return (
      <Card key={senseur.uuid_senseur} className="card-senseur">
        <Card.Header className="card-senseur-header">
          <Container>
            <Row>
              <Col xs={10}>{titre}</Col>
              <Col xs={2} className="card-senseur-editbutton">{boutonsHeader}</Col>
            </Row>
          </Container>
        </Card.Header>

        <div className="card-senseur-timestamp">
          <DateTimeAfficher date={timestampSenseur} />
        </div>

        <Card.Body>

          {rowUuid}

          {apps}

        </Card.Body>
      </Card>
    )
  }
}

function AfficherAppareil(props) {
  // Prendre la vpin modifiee au besoin
  var vpin = ''
  // Verifier override vpin
  var statusToken = ''
  if(props.app.nouveau) {
    statusToken = <i className="fa fa-flag"/>
  }

  var format = ''
  if(['pct', 'humidite'].includes(props.app.type)) format = '%'
  else if(props.app.type === 'temperature') format = " 'C"
  else if(props.app.type === 'pression') format = " kPa"
  else if(props.app.type === 'millivolt') format = " mV"

  return (
    <Container className="card-senseur-contenu">
      <Row className="card-senseur-app">
        <Col lg={7}>
          {statusToken}
          {props.nomApp.replace('/', ' / ')}
        </Col>
        <Col lg={5}>
          {props.app.valeur}{format}
        </Col>
      </Row>
    </Container>
  )
}
