import React, {useState, useEffect, useCallback} from 'react'
import { Row, Col, Button, Form, Alert } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import { ConfigurationLCD } from './NoeudConfigModules'
import { Senseurs } from './NoeudConfigSenseurs'

import { BoutonActif } from '@dugrema/millegrilles.reactjs'
import { useTranslation } from 'react-i18next'

const _contexteCallback = {}

function Noeud(props) {

  // console.debug("Proppys %O", props)
  const { workers, noeudId, listeNoeuds, etatAuthentifie, fermer } = props

  const { t } = useTranslation()

  const [listeSenseurs, setListeSenseurs] = useState([])
  const [erreur, setErreur] = useState('')
  const [noeud, setNoeud] = useState('')

  const connexion = workers.connexion,
        instance_id = noeudId

  // Conserver noeud
  const instNoeud = listeNoeuds.noeuds.filter(noeud=>{
    return noeud.instance_id === instance_id
  })[0] // Filtrer, garder premier element
  useEffect(()=>{ setNoeud(instNoeud) }, [instNoeud])

  // Entretien contexte pour callback comlink proxys
  useEffect(()=>{
    _contexteCallback.listeSenseurs = listeSenseurs
    _contexteCallback.setListeSenseurs = setListeSenseurs
  }, [listeSenseurs, setListeSenseurs])

  const messageRecu = useCallback(comlinkProxy(message => {
    traiterLecture(instance_id, message, _contexteCallback.listeSenseurs, _contexteCallback.setListeSenseurs)
  }), [instance_id])

  const changerSecurite = useCallback(async event => {
    const {value} = event.currentTarget
    const instance_id = props.rootProps.paramsPage.instance_id

    setErreur()

    try {
      const reponse = await connexion.changerSecuriteNoeud(instance_id, value)
      console.debug("Reponse commande changer securite\n%O", reponse)
    } catch(err) {
      setErreur(''+err)
    }
  }, [])

  useEffect(()=>{
    if(etatAuthentifie && noeud && noeud.partition) {
      console.debug("Charger liste senseurs pour : %O", noeud)
      let partition = noeud.partition
      connexion.getListeSenseursNoeud(instance_id, {partition})
        .then(listeSenseurs=>{
          console.debug("Senseurs charges : %O", listeSenseurs)
          setListeSenseurs(listeSenseurs.senseurs)
        })

      connexion.ecouterEvenementsSenseurs(messageRecu)
      return ()=>{
        connexion.retirerEvenementsSenseurs()
      }
    }
  }, [etatAuthentifie, setListeSenseurs, noeud])

  return (
    <div>
      
      <Row>
          <Col xs={10} md={11}>
              <h2>{t('Noeud.titre')}</h2>
          </Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>


      <Alert variant="danger" show={erreur?true:false} dismissible onClose={_=>setErreur()}>
        {erreur}
      </Alert>
      <AfficherInformationNoeud rootProps={props.rootProps}
                                workers={props.workers}
                                etatAuthentifie={etatAuthentifie}
                                noeud={noeud}
                                listeSenseurs={listeSenseurs}
                                majNoeud={props.majNoeud}
                                changerSecurite={changerSecurite}
                                setErreur={setErreur} />
    </div>
  )
}

export default Noeud

function AfficherInformationNoeud(props) {

  const [descriptif, setDescriptif] = useState('')
  const [senseursModeEdition, setSenseursModeEdition] = useState('')
  const [etatBoutonChangeNom, setEtatBoutonChangeNom] = useState('')

  const { workers, etatAuthentifie, setConfirmation, setErreur, noeud } = props

  const connexion = workers.connexion

  const changerNomNoeud = useCallback(async _ => {
    if(!descriptif) { props.setErreur("Veuillez ajouter/modifier le nom du noeud"); return }
    const instance_id = noeud.instance_id, partition = noeud.partition

    try {
      const reponse = await connexion.majNoeud(partition, {instance_id, descriptif})
      console.debug("Reponse changer nom noeud : %O", reponse)
      await props.majNoeud({message: reponse})
      setEtatBoutonChangeNom('succes')
    } catch (err) {
      setEtatBoutonChangeNom('echec')
      props.setErreur(''+err)
    }
  }, [connexion, descriptif, noeud, setConfirmation, setErreur, setEtatBoutonChangeNom])

  const changerSecurite = useCallback(async event => {
    const securite = event.currentTarget.value
    const instance_id = noeud.instance_id, partition = noeud.partition

    try {
      const reponse = await connexion.majNoeud(partition, {instance_id, securite})
      console.debug("Reponse changer nom noeud : %O", reponse)
      await props.majNoeud({message: reponse})
    } catch (err) {
      props.setErreur(''+err)
    }
  }, [connexion, noeud, setConfirmation, setErreur])

  const setModeEdition = useCallback((uuidSenseur, estEdition) => {

    const senseursModeEditionMaj = {...senseursModeEdition}

    if(estEdition) {
      senseursModeEditionMaj[uuidSenseur] = true
    } else {
      delete senseursModeEditionMaj[uuidSenseur]
    }

    setSenseursModeEdition(senseursModeEditionMaj)
  }, [setSenseursModeEdition])

  useEffect(()=>setEtatBoutonChangeNom(''), [descriptif])

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
                          disabled={!etatAuthentifie} />
          </Form.Group>
        </Col>
        <Col md={3}>
          <BoutonActif 
            onClick={changerNomNoeud}
            variant="secondary"
            etat={etatBoutonChangeNom}
            disabled={!etatAuthentifie}>
              Changer nom
          </BoutonActif>
        </Col>
      </Row>
      <Row>
        <Col md={2} className="label">Noeud Id</Col>
        <Col>{noeud.instance_id}</Col>
      </Row>
      <Row>
        <Col md={2} className="label">Securite</Col>
        <Col md={2}>{noeud.securite}</Col>
        <Col md={8}>
          <Button variant="success"
                  disabled={noeud.securite==='3.protege' || !etatAuthentifie}
                  onClick={changerSecurite}
                  value="3.protege">Protege</Button>
          <Button variant="dark"
                  disabled={noeud.securite==='2.prive' || !etatAuthentifie}
                  onClick={changerSecurite}
                  value="2.prive">Prive</Button>
          <Button variant="danger"
                  disabled={noeud.securite==='1.public' || !etatAuthentifie}
                  onClick={changerSecurite}
                  value="1.public">Public</Button>
        </Col>
      </Row>

      <ConfigurationLCD noeud={noeud}
                        etatAuthentifie={etatAuthentifie}
                        rootProps={props.rootProps}
                        workers={props.workers}
                        setErreur={props.setErreur}
                        setConfirmation={props.setConfirmation}
                        majNoeud={props.majNoeud} />

      <Senseurs listeSenseurs={props.listeSenseurs}
                etatAuthentifie={etatAuthentifie}
                noeud={noeud}
                rootProps={props.rootProps}
                workers={props.workers}
                setErreur={props.setErreur}
                traiterLecture={props.traiterLecture}
                setConfirmation={props.setConfirmation}
                setModeEdition={setModeEdition}
                senseursModeEdition={senseursModeEdition}
                majSenseur={props.majSenseur} />
    </div>
  )
}

function traiterLecture(instance_id, evenement, senseurs, setSenseurs) {
  const message = evenement.message,
        uuid_senseur = message.uuid_senseur

  // console.debug("Lecture recue :\n%O\nSenseurs: %O", message, senseurs)

  // Verifier que le messages est pour le instance_id courant
  const noeudIdRecu = message.instance_id
  if(instance_id !== noeudIdRecu) return  // Rien a faire

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
