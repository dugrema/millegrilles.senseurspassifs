import { lazy, useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, {useEtatPret} from './WorkerContext'
import { mergeAppareil } from './redux/appareilsSlice'

const AfficherSenseurs = lazy( () => import('./AfficherSenseurs') )

function Appareil(props) {

    const { appareil, fermer } = props

    const workers = useWorkers()
    const dispatch = useDispatch()
    const etatPret = useEtatPret()

    // Generer liste de senseurs pour le select
    const appareils = useSelector(state=>state.appareils.listeAppareils)
    const listeSenseurs = useMemo(()=>{
        const liste = []
        for(const appareil of appareils) {
            const configuration = appareil.configuration || {}
            const nomAppareil = configuration.descriptif || appareil.uuid_appareil
            const descriptifSenseurs = configuration.descriptif_senseurs || {}
            if(appareil.senseurs) {
                for(const nomSenseur of Object.keys(appareil.senseurs)) {
                    const labelSenseur = descriptifSenseurs[nomSenseur] || nomSenseur
                    const name = nomAppareil + ' ' + labelSenseur
                    const value = appareil.uuid_appareil + ":" + nomSenseur
                    liste.push({name, value})
                }
            }
        }

        liste.sort(sortDisplays)
        // console.debug("Liste senseurs : ", liste)
        return liste
    }, [appareils])

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
    const [editLigneMasque, setEditLigneMasque] = useState(false)

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

    const ouvrirModalHandler = useCallback(event=>{
        const value = event.currentTarget.value
        const valueInt = Number.parseInt(value)
        console.debug("ouvrirModalHandler %s, %s", value, valueInt)
        if(!isNaN(valueInt)) setEditLigneMasque(valueInt)
    }, [setEditLigneMasque])
    const fermerModalHandler = useCallback(()=>setEditLigneMasque(false), [setEditLigneMasque])

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
            <>
                <EditDisplay 
                    displayEdit={displayEdit}
                    appareil={appareil}
                    displays={displays}
                    setDisplays={setDisplays}
                    fermer={boutonFermerDisplayHandler}
                    sauvegarder={majConfigurationHandler}
                    listeSenseurs={listeSenseurs}
                    ouvrirModalHandler={ouvrirModalHandler}
                    />
                <ModalEditerMasqueLigne 
                    show={editLigneMasque!==false} 
                    fermer={fermerModalHandler} />
            </>
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
    }, [setDisplayEdit])

    return (
        <Row>
            <Col>
                <Button variant="link" onClick={selectHandler} value={display.name}>{display.name}</Button>
            </Col>
        </Row>
    )
}

function EditDisplay(props) {
    const { appareil, displayEdit, displays, setDisplays, fermer, sauvegarder, listeSenseurs, ouvrirModalHandler } = props

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
                <Col xs={9} md={10}>
                    <h3>{displayName} sur {nomAppareil}</h3>
                </Col>
                <Col className="bouton-fermer">
                    <Button variant="secondary" onClick={fermer}>X</Button>
                </Col>
            </Row>

            <Display key={displayInformation.name} 
                editMode={true}
                appareil={appareil}
                display={displayInformation} 
                configuration={displayConfiguration}
                majConfigurationHandler={majConfigurationHandler} 
                listeSenseurs={listeSenseurs}
                fermer={fermer} 
                ouvrirModalHandler={ouvrirModalHandler} />

            <Row>
                <Col className="form-button-centrer">
                    <Button onClick={sauvegarder} disabled={!etatPret}>Sauvegarder</Button>
                    <Button variant="secondary" onClick={fermer}>Annuler</Button>
                </Col>
            </Row>
        </div>
    )
}

function AffichageDisplayTexte(props) {
    const { appareil, editMode, display, configuration, majConfigurationHandler, listeSenseurs, ouvrirModalHandler } = props

    const displayName = display.name

    const lignes = useMemo(()=>configuration.lignes || [], [configuration])
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

    const swapLignesHandler = useCallback((idx1, idx2)=>{
        let lignesMaj = [...lignes]
        let ligne1 = lignesMaj[idx1]
        let ligne2 = lignesMaj[idx2]
        lignesMaj[idx1] = ligne2
        lignesMaj[idx2] = ligne1
        majConfigurationHandler({...configuration, lignes: lignesMaj})
    }, [configuration, lignes, majConfigurationHandler])

    return (
        <div>
            <Row><Col>Format texte</Col></Row>
            <Row>
                <Col>
                    Dimensions : {display.width} characteres sur {display.height} lignes
                </Col>
            </Row>

            <Row>
                <Col xs={7} md={6} lg={5} xl={4}>Duree affichage date</Col>
                <Col xs={3} md={2} lg={1}>
                    <Form.Control type="text" value={dureeAffichageDate} onChange={majDureeAffichageDateHandler} />
                </Col>
                <Col xs={2} lg={1} className="text-ellipsis">secondes</Col>
            </Row>

            <p></p>

            <Row>
                <Col xs={8}><h4>Lignes</h4></Col>
                <Col className="bouton-droite">
                    <Button variant="secondary" onClick={ajouterLigneHandler}>+</Button>
                </Col>
            </Row>

            <AfficherLignes
                lignes={lignes}
                appareil={appareil}
                retirerLigneHandler={retirerLigneHandler}
                displayName={displayName}
                modifierLigneHandler={modifierLigneHandler}
                ajouterLigneHandler={ajouterLigneHandler}
                swapLignesHandler={swapLignesHandler}
                listeSenseurs={listeSenseurs}
                height={display.height} 
                ouvrirModalHandler={ouvrirModalHandler} />

            {lignes.length>0?
                <Row className="form-button-centrer form-button-vertmargin">
                    <Col>
                        <Button variant='secondary' onClick={ajouterLigneHandler}>+</Button>
                    </Col>
                </Row>
            :''}

        </div>
    )
}

function AfficherLignes(props) {

    const { 
        appareil, ajouterLigneHandler, retirerLigneHandler, displayName, modifierLigneHandler, 
        listeSenseurs, lignes, height, swapLignesHandler, ouvrirModalHandler,
    } = props

    if(lignes.length===0) return <p>Aucun affichage configure.</p>

    return lignes.map((item, idx)=>{
        let noPage = ''
        if(idx % height === 0) {
            noPage = Math.floor(idx / height) + 1
        }
        return (
            (
                <div key={idx}>
                    {noPage?
                        <h4>Page {noPage}</h4>
                    :''}
                    <LigneEdit
                        idx={idx} 
                        lignes={lignes}
                        value={item} 
                        appareil={appareil}
                        retirerLigneHandler={retirerLigneHandler}
                        displayName={displayName}
                        modifierLigneHandler={modifierLigneHandler}
                        swapLignesHandler={swapLignesHandler}
                        listeSenseurs={listeSenseurs}
                        ouvrirModalHandler={ouvrirModalHandler} />
                </div>
            )
        )
    })
}

function LigneEdit(props) {
    const { 
        idx, lignes, value, appareil, retirerLigneHandler, displayName, modifierLigneHandler, 
        listeSenseurs, swapLignesHandler, ouvrirModalHandler,
    } = props

    const masque = value.masque || ''
    const variable = value.variable || ''
    const duree = value.duree || ''
    const derniereLigne = (lignes.length - 1) <= idx

    const nomvarDuree = [displayName, idx, 'duree'].join('_')

    const swapLignesUpHandler = useCallback(()=>{
        if(idx <= 0) return
        swapLignesHandler(idx-1, idx)
    }, [idx, swapLignesHandler])

    const swapLignesDownHandler = useCallback(()=>{
        if(derniereLigne) return
        swapLignesHandler(idx, idx+1)
    }, [idx, swapLignesHandler, derniereLigne])

    useEffect(()=>{
        if(value.duree === undefined) {
            // Set default duree
            modifierLigneHandler({currentTarget:{name: nomvarDuree, value: '5'}})
        }
    }, [duree, modifierLigneHandler, nomvarDuree])

    return (
        <Row className="display-ligne">

            <Col xs={12}>
                <SelectSenseur 
                    name={[displayName, idx, 'variable'].join('_')}
                    value={variable} 
                    uuid_appareil={appareil.uuid_appareil}
                    liste={listeSenseurs} 
                    onChange={modifierLigneHandler} />
            </Col>

            <Col xs={9}>
                <Form.Control 
                    type="text" 
                    name={[displayName, idx, 'masque'].join('_')} 
                    value={masque} 
                    placeholder="Masque d'affichage, e.g. 'Cuisine {:.1f}'"
                    onChange={modifierLigneHandler} />
            </Col>

            <Col xs={3} className='bouton-droite'>
                <Button variant='secondary' onClick={ouvrirModalHandler} value={''+idx}>
                    <i className="fa fa-newspaper-o" />
                </Button>                
            </Col>

            <Col xs={2}>
                <Button value={idx} variant="secondary" onClick={retirerLigneHandler}>
                    X
                </Button>
            </Col>

            <Form.Label as={Col} htmlFor={''+idx+'duree'} xs={2}>Duree</Form.Label>

            <Col xs={4}>
                <Form.Control 
                    id={''+idx+'duree'}
                    type="number" 
                    name={nomvarDuree} 
                    value={duree} 
                    onChange={modifierLigneHandler} />
            </Col>
            
            <Col xs={4} className='bouton-droite'>
                <Button variant="secondary" onClick={swapLignesUpHandler} disabled={idx===0}>
                    <i className="fa fa-arrow-up" />
                </Button>
                <Button variant="secondary" onClick={swapLignesDownHandler} disabled={derniereLigne}>
                    <i className="fa fa-arrow-down" />
                </Button>
            </Col>

        </Row>
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

function SelectSenseur(props) {
    const { uuid_appareil, liste, name, value, onChange } = props

    // console.debug("SelectSenseur value %s", value)

    return (
        <Form.Select onChange={onChange} name={name} value={value}>
            <option value=''>Aucun senseur selectionne</option>
            {liste.map(item=>{
                let itemValue = item.value
                if(itemValue.startsWith(uuid_appareil)) {
                    itemValue = itemValue.split(':').pop()  // Retirer nom appareil (courant)
                }
                return (
                    <option key={item.value} value={itemValue}>{item.name}</option>
                )
            })}
        </Form.Select>
    )

}

function ModalEditerMasqueLigne(props) {

    const { show, fermer } = props

    return (
        <Modal show={show===true} size='lg' onHide={fermer}>
            <Modal.Header closeButton>
                Editer masque ligne
            </Modal.Header>

            Masque

            <Modal.Footer>
                <Button>Ok</Button>
                <Button onClick={fermer}>Annuler</Button>
            </Modal.Footer>
        </Modal>
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
