import { lazy, useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, {useEtatPret} from './WorkerContext'
import { mergeAppareil } from './redux/appareilsSlice'

const AfficherSenseurs = lazy( () => import('./AfficherSenseurs') )

function Appareil(props) {

    const { appareil, fermer } = props

    const workers = useWorkers()
    const dispatch = useDispatch()
    const etatPret = useEtatPret()

    const [modeEdition, setModeEdition] = useState(false)
    const arreterEditionHandler = useCallback(()=>setModeEdition(false), [setModeEdition])

    const boutonFermerHandler = useCallback(()=>{
        if(modeEdition) setModeEdition(false)
        else fermer()
    }, [modeEdition, setModeEdition, fermer])

    // Configuration sommaire
    const [cacherSenseurs, setCacherSenseurs] = useState([])
    const [descriptif, setDescriptif] = useState('')
    const [descriptifSenseurs, setDescriptifSenseurs] = useState({})
    const [displays, setDisplays] = useState({})
    const [displayEdit, setDisplayEdit] = useState('')

    const boutonFermerDisplayHandler = useCallback(()=>setDisplayEdit(''), [setDisplayEdit])

    const majConfigurationHandler = useCallback(()=>{
        const configMaj = formatterConfiguration(appareil, cacherSenseurs, descriptif, descriptifSenseurs, displays)
        console.debug("Maj configuration ", configMaj)
        workers.connexion.majAppareil(configMaj)
            .then(reponse=>{
                console.debug("Reponse MAJ appareil : ", reponse)
                dispatch(mergeAppareil(reponse))
                setModeEdition(false)
                setDisplayEdit('')
            })
            .catch(err=>console.error("Erreur maj appareil : ", err))
    }, [workers, dispatch, appareil, descriptif, cacherSenseurs, descriptifSenseurs, displays, setModeEdition, setDisplayEdit])

    const boutonEditerHandler = useCallback(event=>{
        if(modeEdition) majConfigurationHandler()
        else setModeEdition(true)
    }, [modeEdition, setModeEdition, majConfigurationHandler])

    useEffect(()=>{
        if(!appareil || modeEdition || displayEdit) return  // Aucune modification externe durant edit
        // Recharger parametres de l'appareil
        const configuration = appareil.configuration || {}
        setDescriptif(configuration.descriptif || '')
        setCacherSenseurs(configuration.cacher_senseurs || [])
        setDescriptifSenseurs(configuration.descriptif_senseurs || {})
        setDisplays(configuration.displays || {})
    }, [modeEdition, displayEdit, appareil, setDescriptif, setCacherSenseurs, setDescriptifSenseurs, setDisplays])

    const configuration = appareil.configuration || {}

    if(displayEdit) {
        return (
            <EditDisplay 
                displayEdit={displayEdit}
                appareil={appareil}
                displays={displays}
                setDisplays={setDisplays}
                fermer={boutonFermerDisplayHandler}
                sauvegarder={majConfigurationHandler}
                />
        )
    }

    return (
        <div>
            <Row>
                <Col xs={8}>
                    <Button onClick={boutonEditerHandler}>
                        {modeEdition?'Sauvegarder':'Editer'}
                    </Button>
                </Col>
                <Col className="bouton-fermer">
                    <Button variant="secondary" onClick={boutonFermerHandler}>
                    {modeEdition?'Annuler':'X'}
                    </Button>
                </Col>
            </Row>

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

            <p></p>

            <AfficherSenseurs 
                appareil={appareil} 
                editMode={modeEdition} 
                cacherSenseurs={cacherSenseurs}
                setCacherSenseurs={setCacherSenseurs}
                descriptifSenseurs={descriptifSenseurs}
                setDescriptifSenseurs={setDescriptifSenseurs} />

            <p></p>

            <ListeDisplays 
                show={!modeEdition} 
                appareil={appareil}
                displays={displays} 
                setDisplays={setDisplays} 
                setDisplayEdit={setDisplayEdit} />
            {/* <AfficherDisplays 
                editMode={modeEdition}
                appareil={appareil} 
                displays={displays} 
                setDisplays={setDisplays} />

            <p></p> */}
            
            {modeEdition?
                <Row>
                    <Col className="form-button-centrer">
                        <Button onClick={majConfigurationHandler} disabled={!etatPret}>Sauvegarder</Button>
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
    
    return (
        <div>
            <NomAppareil 
                modeEdition={modeEdition} 
                descriptif={descriptif}
                setDescriptif={setDescriptif} />

            <Row>
                <Col xs={12} md={5}>Identificateur unique (uuid_appareil)</Col>
                <Col>
                    {appareil.uuid_appareil}
                </Col>
            </Row>
        </div>
    )
}

function NomAppareil(props) {
    const { modeEdition, descriptif, setDescriptif } = props

    const setDescriptifHandler = useCallback(event=>{
        setDescriptif(event.currentTarget.value)
    }, [setDescriptif])

    if(modeEdition) {
        return (
            <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
                <Form.Label column xs={12} md={5}>
                    Descriptif
                </Form.Label>
                <Col>
                    <Form.Control 
                        type="text" 
                        placeholder="Changer nom" 
                        onChange={setDescriptifHandler}
                        value={descriptif} />
                </Col>
            </Form.Group>
        )
    }

    if(descriptif) {
        return (
            <h3>{descriptif}</h3>
        )
    } else {
        return <p></p>
    }

    return ''
}

function ListeDisplays(props) {
    const { show, appareil, displays, setDisplayEdit } = props
    
    if(!show || !appareil.displays) return ''

    const displayList = appareil.displays

    return (
        <>
            <h3>Affichages</h3>
            {
                displayList.map(item=>(
                    <InfoDisplay 
                        key={item.name} 
                        display={item} 
                        setDisplayEdit={setDisplayEdit} />
                ))
            }
        </>
        
    )
}

function InfoDisplay(props) {
    const { display, setDisplayEdit } = props

    const selectHandler = useCallback(event=>{
        const value = event.currentTarget.value
        setDisplayEdit(value)
    })

    return (
        <Row>
            <Col>
                <Button variant="link" onClick={selectHandler} value={display.name}>{display.name}</Button>
            </Col>
        </Row>
    )
}

function EditDisplay(props) {
    const { appareil, displayEdit, displays, setDisplays, fermer, sauvegarder } = props

    const etatPret = useEtatPret()

    const [configurationAppareil, displayInformation] = useMemo(()=>{
        const configuration = appareil.configuration || {}
        const displays = appareil.displays || []
        const displayInformation = displays.filter(item=>item.name === displayEdit).pop()
        return [configuration, displayInformation]
    }, [appareil, displayEdit])

    const displayConfiguration = useMemo(()=>{
        return displays[displayEdit] || {}
    }, [displayEdit, displays])

    const displayName = displayInformation.name
    const nomAppareil = configurationAppareil.descriptif || configurationAppareil.uuid_appareil

    const majConfigurationHandler = useCallback(value=>{
        const displayMaj = {...displays, [displayEdit]: value}
        // console.debug("Display maj : ", displayMaj)
        setDisplays(displayMaj)
    }, [displayEdit, setDisplays, displays])

    const formatDisplay = displayInformation.format
    let Display = null
    switch(formatDisplay) {
        case 'text': Display = AffichageDisplayTexte; break
        default:
            Display = AffichageDisplayNonSupporte
    }

    return (
        <div>
            <Row>
                <Col xs={8}>
                    <h3>Affichage {displayName} sur {nomAppareil}</h3>
                </Col>
                <Col className="bouton-fermer">
                    <Button variant="secondary" onClick={fermer}>X</Button>
                </Col>
            </Row>

            <Display key={displayInformation.name} 
                editMode={true}
                display={displayInformation} 
                configuration={displayConfiguration}
                majConfigurationHandler={majConfigurationHandler} 
                fermer={fermer} />

            <Row>
                <Col className="form-button-centrer">
                    <Button onClick={sauvegarder} disabled={!etatPret}>Sauvegarder</Button>
                    <Button variant="secondary" onClick={fermer}>Annuler</Button>
                </Col>
            </Row>
        </div>
    )
}


// function AfficherDisplays(props) {
//     const { editMode, appareil, displays: configurationDisplays, setDisplays } = props

//     const majConfigurationHandler = useCallback((displayName, value)=>{
//         const displayMaj = {...configurationDisplays, [displayName]: value}
//         setDisplays(displayMaj)
//     }, [configurationDisplays, setDisplays])

//     const displays = useMemo(()=>{
//         let displays = appareil.displays || []
//         displays = [...displays]
//         displays.sort(sortDisplays)
//         return displays
//     }, [appareil])

//     return displays.map(item=>{

//         const { name } = item

//         const displayConfiguration = configurationDisplays[name] || {}

//         const formatDisplay = item.format
//         let Display = null
//         switch(formatDisplay) {
//             case 'text': Display = AffichageDisplayTexte; break
//             default:
//                 Display = AffichageDisplayNonSupporte
//         }

//         return (
//             <Display key={item.name} 
//                 editMode={editMode}
//                 appareil={appareil} 
//                 display={item} 
//                 configuration={displayConfiguration}
//                 majConfigurationHandler={majConfigurationHandler} />
//         )
//     })
// }

function AffichageDisplayTexte(props) {
    const { editMode, display, configuration, majConfigurationHandler } = props

    const displayName = display.name

    const lignes = configuration.lignes || []
    const dureeAffichageDate = configuration.afficher_date_duree || ''

    const majDureeAffichageDateHandler = useCallback(event => {
        let value = event.currentTarget.value
        if(value) value = Number.parseInt(value)
        else value = null
        majConfigurationHandler({...configuration, afficher_date_duree: value})
    }, [configuration, majConfigurationHandler])

    const ajouterLigneHandler = useCallback(()=>{
        let lignesMaj = [...lignes, {}]
        majConfigurationHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationHandler])

    const retirerLigneHandler = useCallback(event=>{
        const { value } = event.currentTarget
        const ligne = Number.parseInt(value)
        let lignesMaj = lignes.filter((_, idx)=>idx!==ligne)
        majConfigurationHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationHandler])

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

        majConfigurationHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationHandler])

    return (
        <div>
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
