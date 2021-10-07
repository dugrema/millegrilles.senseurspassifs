import React, {useState, useEffect, useCallback} from 'react'
import { Row, Col, Button, Form, Alert } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import { ConfigurationBlynk, ConfigurationLCD } from './NoeudConfigModules'
import { Senseurs } from './NoeudConfigSenseurs'

const _contexteCallback = {}

export function Noeud(props) {

  // console.debug("Proppys %O", props)

  const [senseurs, setSenseurs] = useState([])
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [noeud, setNoeud] = useState('')

  const modeProtege = props.rootProps.modeProtege,
        connexion = props.workers.connexion,
        listeNoeuds = props.listeNoeuds,
        noeud_id = props.paramsPage.noeud_id

  // Conserver noeud
  const instNoeud = listeNoeuds.noeuds.filter(noeud=>{
    return noeud.noeud_id === noeud_id
  })[0] // Filtrer, garder premier element
  useEffect(()=>{ setNoeud(instNoeud) }, [instNoeud])

  // Entretien contexte pour callback comlink proxys
  useEffect(()=>{
    _contexteCallback.senseurs = senseurs
    _contexteCallback.setSenseurs = setSenseurs
  }, [senseurs, setSenseurs])

  const messageRecu = useCallback(comlinkProxy(message => {
    traiterLecture(noeud_id, message, _contexteCallback.senseurs, _contexteCallback.setSenseurs)
  }), [noeud_id])

  const changerSecurite = useCallback(async event => {
    const {value} = event.currentTarget
    const noeud_id = props.rootProps.paramsPage.noeud_id

    setErreur()

    try {
      const reponse = await connexion.changerSecuriteNoeud(noeud_id, value)
      console.debug("Reponse commande changer securite\n%O", reponse)
    } catch(err) {
      setErreur(''+err)
    }
  }, [])

  useEffect(()=>{
    if(modeProtege && noeud && noeud.partition) {
      console.debug("Charger liste senseurs pour : %O", noeud)
      let partition = noeud.partition
      connexion.getListeSenseursNoeud(partition, noeud_id)
        .then(senseurs=>{
          console.debug("Senseurs charges : %O", senseurs)
          setSenseurs(senseurs)
        })

      connexion.ecouterEvenementsSenseurs(messageRecu)
      return ()=>{
        connexion.retirerEvenementsSenseurs()
      }
    }
  }, [modeProtege, setSenseurs, noeud])

  // const noeud_id = props.rootProps.paramsPage.noeud_id

  return (
    <div>
      <h1>Noeud</h1>
      <Alert variant="danger" show={erreur?true:false} dismissible onClose={_=>setErreur()}>
        {erreur}
      </Alert>
      <Alert variant="success" show={confirmation?true:false} dismissible onClose={_=>setConfirmation()}>
        {confirmation}
      </Alert>
      <AfficherInformationNoeud rootProps={props.rootProps}
                                workers={props.workers}
                                noeud={noeud} senseurs={senseurs}
                                changerSecurite={changerSecurite}
                                setErreur={setErreur}
                                setConfirmation={setConfirmation} />
    </div>
  )
}

function AfficherInformationNoeud(props) {

  const [descriptif, setDescriptif] = useState('')
  const [senseursModeEdition, setSenseursModeEdition] = useState('')

  const connexion = props.workers.connexion

  const setConfirmation = props.setConfirmation,
        setErreur = props.setErreur,
        noeud = props.noeud,
        blynkActif = noeud.blynk_actif || false

  const changerNomNoeud = useCallback(async _ => {
    console.debug("Changer nom noeud : %s", descriptif)

    if(!descriptif) {
      props.setErreur("Veuillez ajouter/modifier le nom du noeud")
      return
    }

    const noeud_id = noeud.noeud_id

    try {
      const reponse = await connexion.changerNomNoeud(noeud_id, descriptif)
      console.debug("Reponse changer nom noeud : %O", reponse)
    } catch (err) {
      props.setErreur(''+err)
    }
  }, [connexion, descriptif, noeud, setConfirmation, setErreur])

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
                          onChange={event=>{setDescriptif(event.currentTarget.value)}}
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
                          workers={props.workers}
                          setErreur={props.setErreur}
                          setConfirmation={props.setConfirmation} />

      <ConfigurationLCD noeud={noeud}
                        blynkActif={blynkActif}
                        rootProps={props.rootProps}
                        workers={props.workers}
                        setErreur={props.setErreur}
                        setConfirmation={props.setConfirmation} />

      <Senseurs senseurs={props.senseurs}
                noeud={noeud}
                rootProps={props.rootProps}
                workers={props.workers}
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

  // console.debug("Lecture recue :\n%O\nSenseurs: %O", message, senseurs)

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
