import React, {useState, useEffect, useCallback} from 'react'
import { Row, Col, Button, Form, Alert } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import useWorkers from './WorkerContext'

import { Senseurs } from './NoeudConfigSenseurs'

import { BoutonActif } from '@dugrema/millegrilles.reactjs'
import { useTranslation } from 'react-i18next'
import { useEtatAuthentifie } from './WorkerContext'

const _contexteCallback = {}

function Instance(props) {

  // console.debug("Proppys %O", props)
  const { instance, majInstance, fermer } = props

  const { t } = useTranslation()
  const workers = useWorkers()
  const etatAuthentifie = useEtatAuthentifie

  const [listeSenseurs, setListeSenseurs] = useState([])
  const [erreur, setErreur] = useState('')

  const connexion = workers.connexion

  // Entretien contexte pour callback comlink proxys
  useEffect(()=>{
    _contexteCallback.listeSenseurs = listeSenseurs
    _contexteCallback.setListeSenseurs = setListeSenseurs
  }, [listeSenseurs, setListeSenseurs])

  const messageRecu = useCallback(comlinkProxy(message => {
    traiterLecture(instance.instance_id, message, _contexteCallback.listeSenseurs, _contexteCallback.setListeSenseurs)
  }), [instance])

  const changerSecurite = useCallback(async event => {
    const {value} = event.currentTarget

    setErreur()

    try {
      const reponse = await connexion.changerSecuriteNoeud(instance.instance_id, value)
      console.debug("Reponse commande changer securite\n%O", reponse)
    } catch(err) {
      setErreur(''+err)
    }
  }, [instance])

  useEffect(()=>{
    if(etatAuthentifie && instance && instance.partition) {
      console.debug("Charger liste senseurs pour : %O", instance)
      connexion.getListeSenseursNoeud(instance.instance_id)
        .then(listeSenseurs=>{
          console.debug("Senseurs charges : %O", listeSenseurs)
          setListeSenseurs(listeSenseurs.senseurs)
        })

      connexion.ecouterEvenementsSenseurs(messageRecu)
      return ()=>{
        connexion.retirerEvenementsSenseurs()
      }
    }
  }, [etatAuthentifie, setListeSenseurs, instance])

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
      <AfficherInformationNoeud instance={instance}
                                listeSenseurs={listeSenseurs}
                                majNoeud={majInstance}
                                changerSecurite={changerSecurite}
                                setErreur={setErreur} />
    </div>
  )
}

export default Instance

function AfficherInformationNoeud(props) {

  const { setConfirmation, setErreur, instance, listeSenseurs } = props

  const [descriptif, setDescriptif] = useState('')
  const [senseursModeEdition, setSenseursModeEdition] = useState('')
  const [etatBoutonChangeNom, setEtatBoutonChangeNom] = useState('')

  const workers = useWorkers()
  const etatAuthentifie = useEtatAuthentifie()

  const connexion = workers.connexion

  const changerNomNoeud = useCallback(async _ => {
    if(!descriptif) { props.setErreur("Veuillez ajouter/modifier le nom de l'instance"); return }
    const instance_id = instance.instance_id, partition = instance.partition

    try {
      const reponse = await connexion.majNoeud(partition, {instance_id, descriptif})
      console.debug("Reponse changer nom noeud : %O", reponse)
      await props.majNoeud({message: reponse})
      setEtatBoutonChangeNom('succes')
    } catch (err) {
      setEtatBoutonChangeNom('echec')
      props.setErreur(''+err)
    }
  }, [connexion, descriptif, instance, setConfirmation, setErreur, setEtatBoutonChangeNom])

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
                          value={descriptif || instance.descriptif || ''}
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
        <Col>{instance.instance_id}</Col>
      </Row>

      <Senseurs listeSenseurs={listeSenseurs}
                etatAuthentifie={etatAuthentifie}
                noeud={instance}
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

function majInstance(evenement, listeNoeuds, setNoeuds) {
  console.debug("majNoeud message recu : %O", evenement)
  const {message, exchange} = evenement

  const instance_id = message.instance_id

  var trouve = false
  const noeudsMaj = listeNoeuds.noeuds.map(noeud=>{
    if(noeud.instance_id === instance_id) {
      trouve = true
      var copieNoeud = Object.assign({}, noeud)
      copieNoeud = Object.assign(copieNoeud, message)
      copieNoeud.partition = listeNoeuds.partition  // Copier partition du noeud
      return copieNoeud
    }
    return noeud
  })

  if(!trouve) {
    console.debug("majNoeud Nouveau noeud ajoute : %O", message)
    if(!message.securite) message.securite = exchange
    noeudsMaj.push(message)
  }

  setNoeuds({...listeNoeuds, noeuds: noeudsMaj})
}
