import { useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, {useEtatConnexion, WorkerProvider, useUsager, useFormatteurPret, useInfoConnexion} from './WorkerContext'
import { mergeAppareil } from './redux/appareilsSlice'

function Appareil(props) {

    const { appareil, fermer } = props

    const workers = useWorkers()
    const dispatch = useDispatch()

    const [modeEdition, setModeEdition] = useState(false)
    const modeEditionHandler = useCallback(event=>{
        setModeEdition(event.currentTarget.checked)
    }, [setModeEdition])
    const arreterEditionHandler = useCallback(()=>setModeEdition(false), [setModeEdition])

    // Configuration sommaire
    const [cacherSenseurs, setCacherSenseurs] = useState([])
    const [descriptif, setDescriptif] = useState('')
    const [descriptifSenseurs, setDescriptifSenseurs] = useState({})
    const majConfigurationHandler = useCallback(()=>{
        const configMaj = formatterConfiguration(appareil, cacherSenseurs, descriptif, descriptifSenseurs)
        console.debug("Maj configuration ", configMaj)
        workers.connexion.majAppareil(configMaj)
            .then(reponse=>{
                console.debug("Reponse MAJ appareil : ", reponse)
                dispatch(mergeAppareil(reponse))
                setModeEdition(false)
            })
            .catch(err=>console.error("Erreur maj appareil : ", err))
    }, [workers, dispatch, appareil, descriptif, cacherSenseurs, descriptifSenseurs, setModeEdition])

    useEffect(()=>{
        if(!appareil || modeEdition) return  // Aucune modification externe durant edit
        // Recharger parametres de l'appareil
        const configuration = appareil.configuration || {}
        setDescriptif(configuration.descriptif || '')
        setCacherSenseurs(configuration.cacher_senseurs || [])
        setDescriptifSenseurs(configuration.descriptif_senseurs || {})
    }, [modeEdition, appareil, setDescriptif, setCacherSenseurs, setDescriptifSenseurs])

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
                descriptifSenseurs={descriptifSenseurs}
                setDescriptifSenseurs={setDescriptifSenseurs} />

            <p></p>
            
            {modeEdition?
                <Row>
                    <Col className="form-button-centrer">
                        <Button onClick={majConfigurationHandler}>Sauvegarder</Button>
                        <Button variant="secondary" onClick={arreterEditionHandler}>Annuler</Button>
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
    const { appareil, editMode, cacherSenseurs, setCacherSenseurs, setDescriptifSenseurs } = props
    const { senseurs } = appareil
    const configuration = appareil.configuration || {}
    const cacherSenseursNonEdit = configuration.cacher_senseurs || []
    const descriptifSenseurs = props.descriptifSenseurs || configuration.descriptif_senseurs || {}
    
    const liste = useMemo(()=>{
      if(!senseurs) return
  
      const liste = []
      for (const senseurId of Object.keys(senseurs)) {
        const contenu = senseurs[senseurId]
        liste.push({...contenu, senseurId})
      }
      liste.sort(sortSenseurs(appareil))
  
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
  
    const majDescriptifSenseur = useCallback(event=>{
        const {name, value} = event.currentTarget
        setDescriptifSenseurs({...descriptifSenseurs, [name]: value})
    }, [descriptifSenseurs, setDescriptifSenseurs])

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
        
        const descriptif = descriptifSenseurs[senseurId] || ''

        return (
            <Row key={senseurId}>
            <Col xs={1}>
                {editMode?
                    <Form.Check checked={selectionne} onChange={toggleCacherHandler} value={senseurId} />
                :''}
            </Col>

            {editMode?
                <>
                    <Col xs={8} md={4} xl={2}>
                        {item.senseurId}
                    </Col>
                    <Col>
                        <Form.Control 
                            type="text" 
                            placeholder="Chambre, salon, cuisine," 
                            onChange={majDescriptifSenseur}
                            name={senseurId}
                            value={descriptif} />
                    </Col>
                </>
            :
                <>
                    <Col xs={8} md={4} xl={2}>
                        {descriptif || item.senseurId}
                    </Col>
                    <AfficherValeurFormattee senseur={item} />
                </>
            }
            </Row>
        )
    })
}

function sortSenseurs(appareil) {

    const configuration = appareil.configuration || {}
    const descriptif_senseurs = configuration.descriptif_senseurs

    return (a, b) => {
        const senseurIdA = a.senseurId,
              senseurIdB = b.senseurId

        const descriptifA = descriptif_senseurs[senseurIdA],
              descriptifB = descriptif_senseurs[senseurIdB]

        if(descriptifA !== descriptifB) {
            if(!descriptifA) return -1
            if(!descriptifB) return 1
            return descriptifA.localeCompare(descriptifB)
        }

        return senseurIdA.localeCompare(senseurIdB)
    }
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

function formatterConfiguration(appareil, cacherSenseurs, descriptif, descriptifSenseurs) {
    const configuration = {}
    
    if(appareil.configuration) Object.assign(configuration, appareil.configuration)
    configuration.cacher_senseurs = cacherSenseurs
    configuration.descriptif = descriptif
    configuration.descriptif_senseurs = descriptifSenseurs

    return {uuid_appareil: appareil.uuid_appareil, configuration}
}
