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
    const [displays, setDisplays] = useState({})
    const majConfigurationHandler = useCallback(()=>{
        const configMaj = formatterConfiguration(appareil, cacherSenseurs, descriptif, descriptifSenseurs, displays)
        console.debug("Maj configuration ", configMaj)
        workers.connexion.majAppareil(configMaj)
            .then(reponse=>{
                console.debug("Reponse MAJ appareil : ", reponse)
                dispatch(mergeAppareil(reponse))
                setModeEdition(false)
            })
            .catch(err=>console.error("Erreur maj appareil : ", err))
    }, [workers, dispatch, appareil, descriptif, cacherSenseurs, descriptifSenseurs, displays, setModeEdition])

    useEffect(()=>{
        if(!appareil || modeEdition) return  // Aucune modification externe durant edit
        // Recharger parametres de l'appareil
        const configuration = appareil.configuration || {}
        setDescriptif(configuration.descriptif || '')
        setCacherSenseurs(configuration.cacher_senseurs || [])
        setDescriptifSenseurs(configuration.descriptif_senseurs || {})
        setDisplays(configuration.displays || {})
    }, [modeEdition, appareil, setDescriptif, setCacherSenseurs, setDescriptifSenseurs, setDisplays])

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

            <AfficherDisplays 
                editMode={modeEdition}
                appareil={appareil} 
                displays={displays} 
                setDisplays={setDisplays} />

            <p></p>
            
            {modeEdition?
                <Row>
                    <Col className="form-button-centrer">
                        <Button onClick={majConfigurationHandler}>Sauvegarder</Button>
                        <Button variant="secondary" onClick={arreterEditionHandler}>Annuler</Button>
                    </Col>
                </Row>
            :''}

            <p></p>

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
    const descriptif_senseurs = configuration.descriptif_senseurs || {}

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

function AfficherDisplays(props) {
    const { editMode, appareil, displays: configurationDisplays, setDisplays } = props

    const majConfigurationHandler = useCallback((displayName, value)=>{
        const displayMaj = {...configurationDisplays, [displayName]: value}
        setDisplays(displayMaj)
    }, [configurationDisplays, setDisplays])

    const displays = useMemo(()=>{
        let displays = appareil.displays || []
        displays = [...displays]
        displays.sort(sortDisplays)
        return displays
    }, [appareil])

    return displays.map(item=>{

        const { name } = item

        const displayConfiguration = configurationDisplays[name] || {}

        const formatDisplay = item.format
        let Display = null
        switch(formatDisplay) {
            case 'text': Display = AffichageDisplayTexte; break
            default:
                Display = AffichageDisplayNonSupporte
        }

        return (
            <Display key={item.name} 
                editMode={editMode}
                appareil={appareil} 
                display={item} 
                configuration={displayConfiguration}
                majConfigurationHandler={majConfigurationHandler} />
        )
    })
}

function AffichageDisplayTexte(props) {
    const { editMode, appareil, display, configuration, majConfigurationHandler } = props

    const displayName = display.name

    const lignes = configuration.lignes || []
    const dureeAffichageDate = configuration.afficher_date_duree || ''

    const majConfigurationDisplayHandler = useCallback(value => {
        majConfigurationHandler(displayName, value)
    }, [majConfigurationHandler])

    const majDureeAffichageDateHandler = useCallback(event => {
        let value = event.currentTarget.value
        if(value) value = Number.parseInt(value)
        else value = null
        majConfigurationDisplayHandler({...configuration, afficher_date_duree: value})
    }, [configuration, majConfigurationDisplayHandler])

    const ajouterLigneHandler = useCallback(()=>{
        let lignesMaj = [...lignes, {}]
        majConfigurationDisplayHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationDisplayHandler])

    const retirerLigneHandler = useCallback(event=>{
        const { value } = event.currentTarget
        const ligne = Number.parseInt(value)
        let lignesMaj = lignes.filter((_, idx)=>idx!==ligne)
        majConfigurationDisplayHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationDisplayHandler])

    const modifierLigneHandler = useCallback(event=>{
        let {name, value} = event.currentTarget
        // console.debug("modifierLigneHandler %s = %s", name, value)
        const [affichage, ligneStr, nomVar] = name.split('_')

        if(['duree'].includes(nomVar)) {
            // Convertir en int
            value = Number.parseInt(value)
        }

        const ligne = Number.parseInt(ligneStr)

        // console.debug("Modifier ligne %d = %s", ligne, value)
        let lignesMaj = [...lignes]
        let valeurLigne = lignesMaj[ligne] || {}
        valeurLigne = {...valeurLigne}
        valeurLigne[nomVar] = value
        lignesMaj[ligne] = valeurLigne

        majConfigurationDisplayHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationDisplayHandler])

    return (
        <div>
            <h3>Affichage {displayName}</h3>
            <p>Format texte</p>
            <p>Dimensions : {display.width} characteres sur {display.height} lignes</p>

            <Row>
                <Col>Duree affichage date</Col>
                <Col>
                    {editMode?
                        <Form.Control type="text" value={dureeAffichageDate} onChange={majDureeAffichageDateHandler} />
                    :
                        <p>{dureeAffichageDate}</p>
                    }
                </Col>
            </Row>

            <h4>Lignes</h4>
            {editMode?
                <Row>
                    <Col><Button variant="secondary" onClick={ajouterLigneHandler}>Ajouter</Button></Col>
                </Row>
            :''}

            <Row>
                <Col xs={12} lg={8} xl={6}>
                    <Row>
                        <Col xs={2} md={2}>Lignes</Col>
                        <Col xs={10} md={8}>Masque</Col>
                        <Col xs={0} md={2}>Duree</Col>
                        <Col xs={0} md={0}>Senseur</Col>
                    </Row>
                </Col>
            </Row>

            {lignes.length===0?<p>Aucun affichage configure.</p>:''}

            {lignes.map((item, idx)=>{

                const masque = item.masque || ''
                const variable = item.variable || ''
                const duree = item.duree || 5

                return (
                    <Row key={idx}>
                        <Col xs={12} md={8} xl={6}>
                            <Row>
                                <Col xs={2} md={2}>
                                    {editMode?
                                        <Button value={idx} variant="secondary" onClick={retirerLigneHandler}>
                                            X
                                        </Button>
                                    :''}
                                    {idx+1}
                                </Col>
                                <Col xs={10} md={8}>
                                    {editMode?
                                        <Form.Control 
                                            type="text" 
                                            name={[displayName, idx, 'masque'].join('_')} 
                                            value={masque} 
                                            placeholder="Masque d'affichage, e.g. 'Cuisine {:.1f}'"
                                            onChange={modifierLigneHandler} />
                                    :
                                        <p>{masque}</p>
                                    }
                                </Col>
                                <Col xs={4} md={2}>
                                    {editMode?
                                        <Form.Control 
                                            type="text" 
                                            name={[displayName, idx, 'duree'].join('_')} 
                                            value={duree} 
                                            onChange={modifierLigneHandler} />
                                    :
                                        <p>{duree}</p>
                                    }
                                </Col>
                                <Col xs={0} md={2}></Col>
                                <Col xs={8} md={10}>
                                    {editMode?
                                        <Form.Control 
                                            type="text" 
                                            name={[displayName, idx, 'variable'].join('_')} 
                                            value={variable} 
                                            placeholder="variable ou senseur, e.g. appareil:senseur"
                                            onChange={modifierLigneHandler} />
                                    :
                                        <p>{variable}</p>
                                    }
                                </Col>
                            </Row>
                        </Col>
                        <Col>
                            <p>Affichage dummy...</p>
                        </Col>
                    </Row>
                )
            })}
        </div>
    )
}

function AffichageDisplayNonSupporte(props) {
    const { display } = props
    return (
        <div>
            <h3>Affichage {display.name}</h3>
            <p>Cet affichage n'est pas supporte (format = {display.format})</p>
        </div>
    )
}

function formatterConfiguration(appareil, cacherSenseurs, descriptif, descriptifSenseurs, displays) {
    const configuration = {}
    
    if(appareil.configuration) Object.assign(configuration, appareil.configuration)
    configuration.cacher_senseurs = cacherSenseurs
    configuration.descriptif = descriptif
    configuration.descriptif_senseurs = descriptifSenseurs
    configuration.displays = displays

    return {uuid_appareil: appareil.uuid_appareil, configuration}
}


function sortDisplays(a, b) {
    if( a === b ) return 0
    if(!a) return -1
    if(!b) return 1

    const nameA = a.name,
          nameB = b.name

    if(nameA === nameB) return 0
    if(!nameA) return -1
    if(!nameB) return 1

    return nameA.localeCompare(nameB)
}
