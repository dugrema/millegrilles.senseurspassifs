import React from 'react'
import { Row, Col, Button, Form } from 'react-bootstrap';

export class ConfigurationBlynk extends React.Component {

  state = {
    authToken: this.props.noeud.blynk_auth || '',
    host: this.props.noeud.blynk_host || 'blynk',
    port: this.props.noeud.blynk_port || 9443,
    actif: this.props.noeud.blynk_actif || false,
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  changerCheckbox = event => {
    const {name, checked} = event.currentTarget
    this.setState({[name]: checked})
  }

  changerServerBlynk = async _ => {
    const wsa = this.props.workers.connexion

    const host = this.state.host,
          port = Number(this.state.port),
          noeud_id = this.props.noeud.noeud_id

    console.debug("changerServerBlynk %s:%s, noeud_id: ", host, port, noeud_id)

    try {
      await wsa.setServerBlynk(noeud_id, host, port)
      // this.props.rootProps.majNoeud({noeud_id, blynk_host: host, blynk_port: port})
      this.props.setConfirmation("Configuration hote/port Blynk modifiee.")
    } catch (err) {
      this.props.setErreur(''+err)
    }
  }

  changerToken = async _ => {
    const wsa = this.props.workers.connexion

    const authToken = this.state.authToken,
          noeud_id = this.props.noeud.noeud_id

    console.debug("changerToken noeud_id: %s", noeud_id)

    try {
      await wsa.setAuthTokenBlynk(noeud_id, authToken)
      // this.props.rootProps.majNoeud({noeud_id, blynk_auth: authToken})
      this.props.setConfirmation("Configuration auth token Blynk modifiee.")
    } catch(err) {
      this.props.setErreur(''+err)
    }
  }

  sauvegarder = async _ => {
    const wsa = this.props.workers.connexion
    const noeud = this.props.noeud,
          noeud_id = this.props.noeud.noeud_id

    const host = this.state.host,
          port = Number(this.state.port || 9443),
          authToken = this.state.authToken,
          actif = this.state.actif

    console.debug("Noeud %O, state: %O", noeud, this.state)

    var confirmations = ''

    try {
      const actifCourant = this.props.noeud.blynk_actif
      if(actifCourant !== actif) {
        console.debug("Sauvegarder activite blynk: actif=%s", actif)
        await wsa.setActiviteBlynk(noeud_id, actif)
        // this.props.rootProps.majNoeud({noeud_id, blynk_actif: actif})
        confirmations += "Configuration activite Blynk modifiee. "
      }
    } catch(err) {
      this.props.setErreur(''+err)
    }

    try {
      const hostCourant = noeud.blynk_host,
            portCourant = Number(noeud.blynk_port)

      if(host && port && (host !== hostCourant || port !== portCourant)) {
        console.debug("Sauvegarder info host/port blynk: host=%s, port=%d", host, port)
        await wsa.setServerBlynk(noeud_id, host, port)
        // this.props.rootProps.majNoeud({noeud_id, blynk_host: host, blynk_port: port})
        confirmations += "Configuration hote/port Blynk modifiee. "
      }
    } catch (err) {
      this.props.setErreur(''+err)
    }

    try {
      const authTokenCourant = noeud.blynk_auth

      if(authToken && authToken !== authTokenCourant) {
        await wsa.setAuthTokenBlynk(noeud_id, authToken)
        // this.props.rootProps.majNoeud({noeud_id, blynk_auth: authToken})
        confirmations += "Configuration auth token Blynk modifiee. "
      }
    } catch(err) {
      this.props.setErreur(''+err)
    }

    if(confirmations) {
      this.props.setConfirmation(confirmations)
    }

    // console.debug("Sauvegarder info blynk: auth=%s, host=%s, port=%d", authToken, host, port)

  }

  render() {
    const noeud = this.props.noeud

    if( ! ['1.public', '2.prive'].includes(noeud.securite)) return ''

    return (
      <div>
        <h2>Blynk</h2>

        <Row className="row-switch-activation">
          <Form.Label htmlFor="blynk-on" column md="2">
            Blynk actif
          </Form.Label>
          <Col md={1}>
            <Form.Check type="switch"
                        id="blynk-on"
                        name="actif"
                        checked={this.state.actif}
                        onChange={this.changerCheckbox}
                        disabled={!this.props.rootProps.modeProtege} />
          </Col>
        </Row>

        <Row>
          <Form.Label column md="2" htmlFor="blynkHost">
            Server
          </Form.Label>
          <Col md={5}>
            <Form.Group controlId="blynkHost">
              <Form.Control type="text"
                            name="host"
                            onChange={this.changerChamp}
                            value={this.state.host}
                            placeholder="Entrer le blynk Auth token"
                            disabled={!this.props.rootProps.modeProtege} />
            </Form.Group>
          </Col>
          <Form.Label column md="1" htmlFor="blynkPort">
            Port
          </Form.Label>
          <Col md={2}>
            <Form.Group controlId="blynkPort">
              <Form.Control type="text"
                            name="port"
                            onChange={this.changerChamp}
                            value={this.state.port}
                            placeholder="Entrer le blynk Auth token"
                            disabled={!this.props.rootProps.modeProtege} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Form.Label column md="2" htmlFor="blynkAuthToken">
            Auth Token
          </Form.Label>
          <Col md={8}>
            <Form.Group controlId="blynkAuthToken">
              <Form.Control type="text"
                            name="authToken"
                            onChange={this.changerChamp}
                            value={this.state.authToken}
                            placeholder="Entrer le blynk Auth token"
                            disabled={!this.props.rootProps.modeProtege} />
            </Form.Group>
          </Col>
        </Row>

        <Row className="row-boutons">
          <Col>
            <Button variant="secondary"
                    onClick={this.sauvegarder}
                    disabled={!this.props.rootProps.modeProtege}>Sauvegarder</Button>
          </Col>
        </Row>
      </div>
    )
  }
}

export class ConfigurationLCD extends React.Component {

  state = {
    actif: this.props.noeud.lcd_actif || false,

    vpinOnOff: this.props.noeud.lcd_vpin_onoff || '',
    vpinNavigation: this.props.noeud.lcd_vpin_navigation || '',

    lignesAffichage: this.props.noeud.lcd_affichage || [],
    changementLignesAffichage: false,
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  changerCheckbox = event => {
    const {name, checked} = event.currentTarget
    this.setState({[name]: checked})
  }

  changerAffichage = event => {
    const {name, value, dataset} = event.currentTarget
    const numeroLigne = Number(dataset.ligne)
    const nouvellesLignesAffichage = this.state.lignesAffichage.map((item, idx)=>{
      if(idx === numeroLigne) {
        return {...item, [name]: value}
      } else {
        return item
      }
    })
    this.setState({lignesAffichage: nouvellesLignesAffichage, changementLignesAffichage: true})
  }

  ajouterLigneAffichage = _ => {
    // console.debug("Ajouter ligne affichage")
    this.setState({
      lignesAffichage: [
        ...this.state.lignesAffichage,
        {uuid: '', appareil: '', affichage: ''}
      ],
      changementLignesAffichage: true,
    })
  }

  supprimerLigneAffichage = event => {
    const numeroLigne = Number(event.currentTarget.value)
    const nouvellesLignesAffichage = this.state.lignesAffichage.filter((_, idx)=>{
      if(idx === numeroLigne) return false
      return true
    })
    this.setState({lignesAffichage: nouvellesLignesAffichage, changementLignesAffichage: true})
  }

  sauvegarder = async _ => {
    const wsa = this.props.workers.connexion
    const noeud_id = this.props.noeud.noeud_id

    var confirmations = ''
    const actif = this.state.actif,
          vpinOnOff = this.state.vpinOnOff,
          vpinNavigation = this.state.vpinNavigation,
          lignesAffichage = this.state.lignesAffichage

    // Sauvegarder activite LCD si changee
    try {
      const actifCourant = this.props.noeud.lcd_actif
      if(actifCourant !== actif) {
        console.debug("Sauvegarder info lcd : actif=%s", actif)
        await wsa.setActiviteLcd(noeud_id, actif)
        // this.props.rootProps.majNoeud({noeud_id, lcd_actif: actif})
        confirmations += "Configuration activite LCD modifiee. "
      }
    } catch(err) {
      this.props.setErreur(''+err)
    }

    // Sauvegarder VPINs de controle du LCD
    try {
      const vpinOnOffCourant = this.props.noeud.lcd_vpin_onoff,
            vpinNavigationCourant = this.props.noeud.lcd_vpin_navigation

      if(vpinOnOff !== vpinOnOffCourant || vpinNavigation !== vpinNavigationCourant) {
        console.debug("Sauvegarder VPIN Blynk pour LCD : vpinOnOff=%s, vpinNavigation=%s", vpinOnOff, vpinNavigation)
        await wsa.setVpinLcd(noeud_id, vpinOnOff, vpinNavigation)
        // this.props.rootProps.majNoeud({noeud_id, lcd_vpin_onoff: vpinOnOff, lcd_vpin_navigation: vpinNavigation})
        confirmations += "Configuration VPIN Blynk pour LCD modifiee. "
      }
    } catch(err) {
      this.props.setErreur(''+err)
    }

    // Sauvegarder la configuration d'affichage
    try {
      if(this.state.changementLignesAffichage) {
        console.debug("Sauvegarder configuration affichage LCD : %O", lignesAffichage)
        await wsa.setAffichageLcd(noeud_id, lignesAffichage)
        // this.props.rootProps.majNoeud({noeud_id, lcd_affichage: lignesAffichage})
        confirmations += "Configuration affichage LCD modifiee. "
      }
    } catch(err) {
      this.props.setErreur(''+err)
    }

    if(confirmations) {
      this.props.setConfirmation(confirmations)
    }
  }

  render() {

    var rowBlynk = ''
    if(this.props.blynkActif) {
      rowBlynk = (
        <>
          <h3>Controles Blynk du LCD</h3>

          <Row>

            <Form.Label column md={2}>ON/OFF</Form.Label>
            <Col md={2}>
              <Form.Group controlId={"vpinOnOff"}>
                <Form.Control type="text" name="vpinOnOff" onChange={this.changerChamp}
                              value={this.state.vpinOnOff} placeholder="VPIN"
                              disabled={!this.props.rootProps.modeProtege} />
              </Form.Group>
            </Col>

            <Form.Label column md={2}>Navigation</Form.Label>
            <Col md={2}>
              <Form.Group controlId={"vpinNavigation"}>
                <Form.Control type="text" name="vpinNavigation" onChange={this.changerChamp}
                              value={this.state.vpinNavigation} placeholder="VPIN"
                              disabled={!this.props.rootProps.modeProtege} />
              </Form.Group>
            </Col>

          </Row>
        </>
      )
    }

    return (
      <div className="config-lcd">
        <Row><Col><h2>LCD</h2></Col></Row>

        <Row className="row-switch-activation">
          <Form.Label column md={2} htmlFor="lcd-on">
            LCD actif
          </Form.Label>
          <Col md={2}>
            <Form.Check type="switch"
                        id="lcd-on"
                        name="actif"
                        checked={this.state.actif}
                        onChange={this.changerCheckbox}
                        disabled={!this.props.rootProps.modeProtege} />
          </Col>
        </Row>

        {rowBlynk}

        <AffichageLcd lignesAffichage={this.state.lignesAffichage}
                      changerAffichage={this.changerAffichage}
                      ajouterLigneAffichage={this.ajouterLigneAffichage}
                      supprimerLigneAffichage={this.supprimerLigneAffichage}
                      rootProps={this.props.rootProps} />

        <Row>
          <Col className="row-boutons">
            <Button onClick={this.sauvegarder} variant="secondary"
                    disabled={!this.props.rootProps.modeProtege}>Sauvegarder</Button>
          </Col>
        </Row>

      </div>
    )
  }
}


function AffichageLcd(props) {

  const ligneAffichageRendered = props.lignesAffichage.map((item, idx)=>{
    return (
      <LigneAffichageLcd key={idx} numeroLigne={idx}
                         uuid={item.uuid}
                         appareil={item.appareil}
                         affichage={item.affichage}
                         changerAffichage={props.changerAffichage}
                         supprimerLigneAffichage={props.supprimerLigneAffichage}
                         rootProps={props.rootProps} />
    )
  })

  return (
    <>
      <h3>Affichage du LCD</h3>

      <p>Configurer les lignes affichees sur l'ecran LCD.</p>

      <p>Formattage (champ affichage). Voir reference : <a href="https://docs.python.org/3/library/string.html">Python string reference</a></p>

      <p>
        Cheat sheet :
          {"{0} ou {0:s}"} = string,
          {"{0:d}"} = decimal,
          {"{0:.2f}"} = fix 2 chiffres apres point decimal
      </p>

      {ligneAffichageRendered}

      <Row>
        <Col className="row-boutons">
          <Button onClick={props.ajouterLigneAffichage} variant="secondary"
                  disabled={!props.rootProps.modeProtege}>
            Ajouter ligne
          </Button>
        </Col>
      </Row>
    </>
  )
}

function LigneAffichageLcd(props) {

  const numeroLigne = props.numeroLigne

  return (
    <>
      <Row>
        <Col md={2} className="label">Affichage</Col>
        <Col md={9}>
          <Form.Group controlId={"affichage" + numeroLigne}>
            <Form.Control type="text"
                          name={"affichage"}
                          data-ligne={numeroLigne}
                          onChange={props.changerAffichage}
                          value={props.affichage} placeholder="Temp %s"
                          disabled={!props.rootProps.modeProtege} />
          </Form.Group>
        </Col>
        <Col md={1}>
          <Button onClick={props.supprimerLigneAffichage} value={numeroLigne}
                  variant="secondary" disabled={!props.rootProps.modeProtege}>
            <i className="fa fa-close"/>
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={2} className="label">UUID</Col>
        <Col md={5}>
          <Form.Group controlId={"uuid" + numeroLigne}>
            <Form.Control type="text"
                          name={"uuid"}
                          data-ligne={numeroLigne}
                          onChange={props.changerAffichage}
                          value={props.uuid} placeholder="UUID"
                          disabled={!props.rootProps.modeProtege} />
          </Form.Group>
        </Col>

        <Col md={1} className="label">Appareil</Col>
        <Col md={4}>
          <Form.Group controlId={"appareil" + numeroLigne}>
            <Form.Control type="text"
                          name={"appareil"}
                          data-ligne={numeroLigne}
                          onChange={props.changerAffichage}
                          value={props.appareil} placeholder="appareil/donnee"
                          disabled={!props.rootProps.modeProtege} />
          </Form.Group>
        </Col>

      </Row>

      <hr />
    </>
  )
}
