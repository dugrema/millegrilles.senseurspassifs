import React, {useState, useEffect, useCallback} from 'react'
import { Row, Col, Button, Form, Alert } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import { ConfigurationBlynk, ConfigurationLCD } from './NoeudConfigModules'
import { Senseurs } from './NoeudConfigSenseurs'

// const routingKeysNoeud = [
//   'transaction.SenseursPassifs.*.majSenseur',
//   'transaction.SenseursPassifs.majSenseur',
//   'evenement.SenseursPassifs.*.lecture',
//   'evenement.SenseursPassifs.lecture'
// ]

const _contexteCallback = {}

export function Noeud(props) {

  // console.debug("Proppys %O", props)

  const [senseurs, setSenseurs] = useState([])
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const modeProtege = props.rootProps.modeProtege,
        connexion = props.workers.connexion,
        noeuds = props.noeuds,
        noeud_id = props.paramsPage.noeud_id

  // Entretien contexte pour callback comlink proxys
  useEffect(()=>{
    _contexteCallback.senseurs = senseurs
    _contexteCallback.setSenseurs = setSenseurs
  }, [senseurs, setSenseurs])

  const messageRecu = useCallback(comlinkProxy(message => {
    traiterLecture(noeud_id, message, _contexteCallback.senseurs, _contexteCallback.setSenseurs)
    // console.debug("Message recu :\n%O", message)
    // var action = message.routingKey.split('.').pop()

    // if(action === 'lecture') {
    //   const noeudId = noeud_id
    //   const noeudIdRecu = message.message.noeud_id
    //   // console.debug("Lecture recue : %O", message.message)
    //   if(noeudId === noeudIdRecu) {
    //     this.traiterLecture(message.message, message.exchange, this.state.senseurs, param=>{this.setState(param)})
    //   }
    // }
  }), [noeud_id])

  // const traiterLectureHandler = useCallback((message, exchange) => {
  //   traiterLecture(message, exchange, senseurs, param=>{this.setState(param)})
  // }, [])

  const changerSecurite = useCallback(async event => {
    const {value} = event.currentTarget
    // const wsa = props.rootProps.websocketApp
    const noeud_id = props.rootProps.paramsPage.noeud_id

    this.setErreur()

    try {
      const reponse = await connexion.changerSecuriteNoeud(noeud_id, value)
      console.debug("Reponse commande changer securite\n%O", reponse)
      props.rootProps.majNoeud(reponse)
    } catch(err) {
      setErreur(''+err)
    }
  }, [])

  useEffect(()=>{
    if(modeProtege) {
      connexion.getListeSenseursNoeud(noeud_id)
        .then(senseurs=>{
          console.debug("Senseurs charges : %O", senseurs)
        })

      connexion.ecouterEvenementsSenseurs(messageRecu)
      return ()=>{
        connexion.retirerEvenementsSenseurs()
      }
    }
  }, [modeProtege])

  // const noeud_id = props.rootProps.paramsPage.noeud_id

  const noeud = noeuds.filter(noeud=>{
    return noeud.noeud_id === noeud_id
  })[0] // Filtrer, garder premier element

  // var erreur = '', confirmation = ''
  if(erreur) {
    erreur = (
      <Alert variant="danger" dismissible onClose={_=>setErreur()}>
        {erreur}
      </Alert>
    )
  }
  if(confirmation) {
    confirmation = (
      <Alert variant="success" dismissible onClose={_=>setConfirmation()}>
        {confirmation}
      </Alert>
    )
  }

  return (
    <div>
      <h1>Noeud</h1>
      {erreur}
      {confirmation}
      <AfficherInformationNoeud rootProps={props.rootProps}
                                workers={props.workers}
                                noeud={noeud} senseurs={senseurs}
                                changerSecurite={changerSecurite}
                                setErreur={setErreur}
                                majNoeud={props.rootProps.majNoeud}
                                setConfirmation={setConfirmation} />
    </div>
  )
}

function AfficherInformationNoeud(props) {

  // state = {
  //   descriptif: '',
  //   senseursModeEdition: {},  // Senseurs en mode d'edition. cle : uuid, valeur : true
  // }

  const [descriptif, setDescriptif] = useState('')
  const [senseursModeEdition, setSenseursModeEdition] = useState('')

  const connexion = props.workers.connexion

  const majNoeud = props.majNoeud,
        setConfirmation = props.setConfirmation,
        setErreur = props.setErreur,
        noeud = props.noeud,
        blynkActif = noeud.blynk_actif || false

  // changerChamp = event => {
  //   const {name, value} = event.currentTarget
  //   this.setState({[name]: value})
  // }

  const changerNomNoeud = useCallback(async _ => {
    console.debug("Changer nom noeud : %s", this.state.descriptif)

    if(!descriptif) {
      props.setErreur("Veuillez ajouter/modifier le nom du noeud")
      return
    }

    const noeud_id = noeud.noeud_id

    try {
      connexion.changerNomNoeud(noeud_id, descriptif)
      majNoeud({noeud_id, descriptif})
      setConfirmation("Nom du noeud change.")
    } catch (err) {
      props.setErreur(''+err)
    }
  }, [connexion, descriptif, noeud, majNoeud, setConfirmation, setErreur])

  const setModeEdition = useCallback((uuidSenseur, estEdition) => {

    const senseursModeEditionMaj = {...senseursModeEdition}

    if(estEdition) {
      senseursModeEditionMaj[uuidSenseur] = true
    } else {
      delete senseursModeEditionMaj[uuidSenseur]
    }

    setSenseursModeEdition(senseursModeEditionMaj)
  }, [setSenseursModeEdition])

  return (
    <div className="config-page">
      <Row>
        <Col md={2} className="label">Nom</Col>
        <Col md={7}>
          <Form.Group controlId="nomNoeud">
            <Form.Control type="text"
                          name="descriptif"
                          onChange={setDescriptif}
                          value={descriptif || noeud.descriptif || ''}
                          placeholder="Mettre un nom pour le noeud ..."
                          disabled={!props.rootProps.modeProtege} />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Button onClick={changerNomNoeud}
                  variant="secondary"
                  disabled={!props.rootProps.modeProtege}>Changer nom</Button>
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
                  disabled={noeud.securite==='3.protege' || !props.rootProps.modeProtege}
                  onClick={props.changerSecurite}
                  value="3.protege">Protege</Button>
          <Button variant="dark"
                  disabled={noeud.securite==='2.prive' || !props.rootProps.modeProtege}
                  onClick={props.changerSecurite}
                  value="2.prive">Prive</Button>
          <Button variant="danger"
                  disabled={noeud.securite==='1.public' || !props.rootProps.modeProtege}
                  onClick={props.changerSecurite}
                  value="1.public">Public</Button>
        </Col>
      </Row>

      <ConfigurationBlynk noeud={noeud}
                          rootProps={props.rootProps}
                          setErreur={props.setErreur}
                          setConfirmation={props.setConfirmation} />

      <ConfigurationLCD noeud={noeud}
                        blynkActif={blynkActif}
                        rootProps={props.rootProps}
                        setErreur={props.setErreur}
                        setConfirmation={props.setConfirmation} />

      <Senseurs senseurs={props.senseurs}
                noeud={noeud}
                rootProps={props.rootProps}
                setErreur={props.setErreur}
                traiterLecture={props.traiterLecture}
                setConfirmation={props.setConfirmation}
                setModeEdition={setModeEdition}
                senseursModeEdition={senseursModeEdition}
                blynkActif={blynkActif} />
    </div>
  )
}

async function chargerSenseurs(wsa, setState, noeud_id) {
  const senseurs = await wsa.getListeSenseursNoeud(noeud_id)
  // console.debug("Senseurs:\n%O", senseurs)
  setState({senseurs})
}

function traiterLecture(noeud_id, evenement, senseurs, setSenseurs) {
  const message = evenement.message,
        uuid_senseur = message.uuid_senseur

  console.debug("Lecture recue :\n%O\nSenseurs: %O", message, senseurs)

  // Verifier que le messages est pour le noeud_id courant
  const noeudIdRecu = message.noeud_id
  if(noeud_id !== noeudIdRecu) return  // Rien a faire

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
    // if(!message.securite) message.securite = exchange
    message.nouveau = true
    copieSenseurs.push(message)
  }

  // console.debug("Nouvelle liste senseurs :\n%O", copieSenseurs)

  setSenseurs(copieSenseurs)
}
