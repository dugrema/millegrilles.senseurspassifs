import { useState, useCallback, useMemo, useEffect } from 'react'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, {useEtatConnexion, WorkerProvider, useUsager, useFormatteurPret, useInfoConnexion} from './WorkerContext'

function Appareil(props) {

    const { appareil, fermer } = props

    const workers = useWorkers()

    const [modeEdition, setModeEdition] = useState(false)
    const modeEditionHandler = useCallback(event=>{
        setModeEdition(event.currentTarget.checked)
    }, [setModeEdition])

    // Configuration sommaire
    const [cacherSenseurs, setCacherSenseurs] = useState([])
    const [descriptif, setDescriptif] = useState('')
    const majConfigurationHandler = useCallback(()=>{
        const configMaj = formatterConfiguration(appareil, cacherSenseurs, descriptif)
        console.debug("Maj configuration ", configMaj)
        workers.connexion.majAppareil(configMaj)
            .then(reponse=>console.debug("Reponse MAJ appareil : ", reponse))
            .catch(err=>console.error("Erreur maj appareil : ", err))
    }, [workers, appareil, descriptif, cacherSenseurs])

    useEffect(()=>{
        if(!appareil || modeEdition) return  // Aucune modification externe durant edit
        // Recharger parametres de l'appareil
        const configuration = appareil.configuration || {}
        setDescriptif(configuration.descriptif || '')
        setCacherSenseurs(configuration.cacher_senseurs || [])
    }, [modeEdition, appareil, setDescriptif, setCacherSenseurs])

    const configuration = appareil.configuration || {}
    const nomAppareil = configuration.descriptif || appareil.uuid_appareil

    return (
        <div>
            <Row>
                <Col xs={10} lg={11}>
                    <h2>Appareil {nomAppareil}</h2>
                </Col>
                <Col className="bouton-fermer">
                    <Button variant="secondary" onClick={fermer}>X</Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Form.Check type="switch" label="Editer" onChange={modeEditionHandler} checked={modeEdition} />
                </Col>
            </Row>

            <h3>Information nominative</h3>
            <InformationAppareil 
                appareil={appareil} 
                modeEdition={modeEdition} 
                descriptif={descriptif}
                setDescriptif={setDescriptif} />

            <h3>Senseurs</h3>
            <Row>
                <Col xs={12} md={5}>Plus recente lecture</Col>
                <Col>
                    <FormatterDate value={appareil.derniere_lecture} />
                </Col>
            </Row>

            <AfficherSenseurs 
                appareil={appareil} 
                editMode={modeEdition} 
                cacherSenseurs={cacherSenseurs}
                setCacherSenseurs={setCacherSenseurs}
                />

            <p></p>
            
            {modeEdition?
                <Row>
                    <Col className="form-button-centrer">
                        <Button onClick={majConfigurationHandler}>Sauvegarder</Button>
                        <Button variant="secondary" onClick={fermer}>Annuler</Button>
                    </Col>
                </Row>
            :''}
        </div>
    )

}

export default Appareil

function InformationAppareil(props) {
    const { appareil, modeEdition, descriptif, setDescriptif } = props
    
    const setDescriptifHandler = useCallback(event=>{
        setDescriptif(event.currentTarget.value)
    }, [setDescriptif])

    return (
        <div>
            <Row>
                <Col xs={12} md={5}>Identificateur unique (uuid_appareil)</Col>
                <Col>
                    {appareil.uuid_appareil}
                </Col>
            </Row>

            {modeEdition?
                <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
                    <Form.Label column xs={12} md={5}>
                        Descriptif
                    </Form.Label>
                    <Col>
                        <Form.Control 
                            type="text" 
                            placeholder="Chambre, salon, cuisine," 
                            onChange={setDescriptifHandler}
                            value={descriptif} />
                    </Col>
                </Form.Group>
            :
                <Row>
                    <Col xs={12} md={5}>Descriptif</Col>
                    <Col>
                        {descriptif || 'N/D'}
                    </Col>
                </Row>
            }

        </div>
    )
}


export function AfficherSenseurs(props) {
    const { appareil, editMode, cacherSenseurs, setCacherSenseurs } = props
    const { senseurs } = appareil
    const configuration = appareil.configuration || {}
    const cacherSenseursNonEdit = configuration.cacher_senseurs || []
  
    const liste = useMemo(()=>{
      if(!senseurs) return
  
      const liste = []
      for (const senseurId of Object.keys(senseurs)) {
        const contenu = senseurs[senseurId]
        liste.push({...contenu, senseurId})
      }
      liste.sort(sortSenseurs)
  
      return liste
    }, [senseurs])

    const toggleCacherHandler = useCallback(event=>{
        const { checked, value } = event.currentTarget
        console.debug("toggleCacherHandler value : %s, checked %s", value, checked)
        let copie = [...cacherSenseurs]
        if(!checked) copie.push(value)
        else copie = copie.filter(item=>item !== value)
        setCacherSenseurs(copie)
    }, [cacherSenseurs, setCacherSenseurs])
  
    if(!senseurs) return ''
  
    return liste.map(item=>{
        const senseurId = item.senseurId
        
        let selectionne = false
        if(cacherSenseurs) {
            selectionne = ! cacherSenseurs.includes(senseurId)
        } else {
            selectionne = ! cacherSenseursNonEdit.includes(senseurId)
        }

        if(!editMode && !selectionne) return ''  // Cacher le senseur
        
        return (
            <Row key={senseurId}>
            <Col xs={1}>
                {editMode?
                    <Form.Check checked={selectionne} onChange={toggleCacherHandler} value={senseurId} />
                :''}
            </Col>
            <Col xs={8} md={4} xl={2}>{item.senseurId}</Col>
            <AfficherValeurFormattee senseur={item} />
            </Row>
        )
    })
}

function sortSenseurs(a, b) {
    const senseurIdA = a.senseurId,
          senseurIdB = b.senseurId
    
    return senseurIdA.localeCompare(senseurIdB)
}
  
function AfficherValeurFormattee(props) {
    const { senseur } = props
    const { timestamp, valeur, valeur_str, type} = senseur
  
    if(valeur_str) return <Col xs={3} md={2}>{valeur_str}</Col>  // Aucun formattage
  
    if(type === 'temperature') {
      return (
        <>
          <Col xs={2} md={1} className="valeur-numerique">{valeur.toFixed(1)}</Col>
          <Col xs={1}>&deg;C</Col>
        </>
      )
    } else if(type === 'humidite') {
      return (
        <>
          <Col xs={2} md={1} className="valeur-numerique">{valeur.toFixed(1)}</Col>
          <Col xs={1}>%</Col>
        </>
        )
    } else if(type === 'pression') {
      return (
        <>
          <Col xs={2} md={1}className="valeur-numerique">{valeur.toFixed(1)}</Col>
          <Col xs={1}>kPa</Col>
        </>
      )
    }
  
    // Format non reconnu
    return valeur
}

function formatterConfiguration(appareil, cacherSenseurs, descriptif) {
    const configuration = {}
    
    if(appareil.configuration) Object.assign(configuration, appareil.configuration)
    configuration.cacher_senseurs = cacherSenseurs
    configuration.descriptif = descriptif

    return {uuid_appareil: appareil.uuid_appareil, configuration}
}
