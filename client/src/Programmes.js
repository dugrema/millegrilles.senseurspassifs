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

export function ListeProgrammes(props) {
    const { show, appareil, setProgrammeEdit } = props
    
    const ajouterHandler = useCallback(()=>setProgrammeEdit(true), [setProgrammeEdit])

    if(!show) return ''

    return (
        <>
            <h3>Programmes et notifications</h3>
            <p>
                <Button variant="secondary" onClick={ajouterHandler}>Ajouter</Button>
            </p>
            {/* {
                displayList.map(item=>(
                    <InfoDisplay 
                        key={item.name} 
                        display={item} 
                        setDisplayEdit={setDisplayEdit} />
                ))
            } */}
        </>
        
    )
}

export function EditProgramme(props) {
    const { appareil, programmeEdit, programmes, setProgrammes, fermer, sauvegarder, listeSenseurs } = props

    const etatPret = useEtatPret()

    const [configurationAppareil, programmeInformation] = useMemo(()=>{
        const configuration = appareil.configuration || {}
        const programmes = appareil.programmes || []
        let programmeInformation = {}
        if(programmeEdit !== true) {
            programmeInformation = programmes.filter(item=>item.programme_id === programmeEdit).pop()
        }
        return [configuration, programmeInformation]
    }, [appareil, programmeEdit])

    // const displayConfiguration = useMemo(()=>{
    //     return displays[displayEdit] || {}
    // }, [displayEdit, displays])
    const programmeId = useMemo(()=>{
        if(programmeInformation.programme_id) return programmeInformation.programme_id
        // Generer nouvel identificateur
        return 'todo-uuid-programme'
    }, [programmeInformation])
    const nomAppareil = configurationAppareil.descriptif || configurationAppareil.uuid_appareil

    const [descriptif, setDescriptif] = useState(programmeInformation.descriptif?programmeInformation.descriptif:programmeId)
    const setDescriptifHandler = useCallback(event=>setDescriptif(event.currentTarget.value), [setDescriptif])

    const [classeProgramme, setClasseProgramme] = useState('')

    const [argsProgramme, setArgsProgramme] = useState(programmeInformation.args||{})

    const changeClasseHandler = useCallback(event => {
        const value = event.currentTarget.value
        console.debug('changeClasseHandler Nouvelle classe : %s', value)
        setClasseProgramme(value)
    }, [setClasseProgramme])

    // const majConfigurationHandler = useCallback(value=>{
    //     const displayMaj = {...displays, [displayEdit]: value}
    //     // console.debug("Display maj : ", displayMaj)
    //     setDisplays(displayMaj)
    // }, [displayEdit, setDisplays, displays])

    // const formatDisplay = displayInformation.format
    // let Display = null
    // switch(formatDisplay) {
    //     case 'text': Display = AffichageDisplayTexte; break
    //     default:
    //         Display = AffichageDisplayNonSupporte
    // }

    return (
        <div>
            <Row>
                <Col xs={9} md={10}>
                    <h3>Programme sur {nomAppareil}</h3>
                </Col>
                <Col className="bouton-fermer">
                    <Button variant="secondary" onClick={fermer}>X</Button>
                </Col>
            </Row>

            <Form.Group as={Row} className="mb-3" controlId="formHorizontalDescriptif">
                <Form.Label column xs={12} md={5}>
                    Descriptif
                </Form.Label>
                <Col>
                    <Form.Control 
                        type="text" 
                        placeholder="Changer nom" 
                        onChange={setDescriptifHandler}
                        value={descriptif} 
                        autoComplete='false'
                        autoCorrect='false'
                        autoCapitalize='false'
                        spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId="formHorizontalType">
                <Form.Label column xs={12} md={5}>
                    Type
                </Form.Label>
                <Col>
                    <ProgrammesSelect nouveau={programmeEdit===true} onChange={changeClasseHandler} />
                </Col>
            </Form.Group>

            <ConfigurerProgramme
                appareil={appareil}
                programmeId={programmeId}
                classeProgramme={classeProgramme}
                args={argsProgramme}
                setArgs={setArgsProgramme}
                listeSenseurs={listeSenseurs}
                />

            <Row>
                <Col className="form-button-centrer">
                    <Button onClick={sauvegarder} disabled={!etatPret}>Sauvegarder</Button>
                    <Button variant="secondary" onClick={fermer}>Annuler</Button>
                </Col>
            </Row>

        </div>
    )
}

function ProgrammesSelect(props) {

    const { typeProgramme, nouveau, onChange } = props

    if(nouveau !== true) {
        return <OptionsProgrammes readonly={true} value={typeProgramme} />
    }

    return (
        <Form.Select onChange={onChange}>
            <option>Selectionnez un programme</option>
            <OptionsProgrammes />
        </Form.Select>
    )
}

function OptionsProgrammes(props) {

    const { readonly, value } = props

    const programmes = getProgrammesDisponibles()

    if(readonly) {
        const programme = programmes.filter(item=>item.nomClasse===value).pop()
        return <span>{programme.nomProgramme}</span>
    }

    return programmes.map(item=>{
        return (
            <option key={item.nom} value={item['class']||''}>{item.nom}</option>
        )
    })
}

function getProgrammesDisponibles() {
    return [
        {
            nom: 'Humidificateur', 
            'class': 'programmes.environnement.Humidificateur',
            args: [
                {'parametre': 'senseurs_humidite', device: true, 'type': 'humidite', mandatory: true},
                {'parametre': 'switches_humidificateurs', device: true, 'type': 'switch', mandatory: true},
                {'parametre': 'humidite', type: 'float', 'default': 50.0, range: [0, 100], mandatory: true},
                {'parametre': 'precision', type: 'float', 'default': 2.0, range: [0, 100], mandatory: true},
                {'parametre': 'duree_on_min', type: 'int', 'default': 30},
                {'parametre': 'duree_off_min', type: 'int', 'default': 30},
            ]
        },
        {
            nom: 'Timer', 
            'class': 'programmes.timers.TimerHebdomadaire',
            args: [
                {'parametre': 'switches', device: true, 'type': 'switch', mandatory: true},
                {'parametre': 'horaire', type: 'list', itemType: 'timeofweek', mandatory: true},
            ]
        },
    ]
}

function ConfigurerProgramme(props) {

    const { appareil, programmeId, classeProgramme, args, setArgs, listeSenseurs } = props

    if(!classeProgramme) return ''

    let ClasseEditeur = null
    switch(classeProgramme) {
        case 'programmes.environnement.Humidificateur': ClasseEditeur = EditerProgrammeHumidificateur; break
        case 'programmes.timers.TimerHebdomadaire': ClasseEditeur = EditerProgrammeTimer; break
        default: ClasseEditeur = EditerProgrammeNonSupporte
    }

    return (
        <ClasseEditeur 
            appareil={appareil}
            programmeId={programmeId}
            args={args}
            setArgs={setArgs}
            listeSenseurs={listeSenseurs}
            />
    )
}

function EditerProgrammeNonSupporte(props) {
    return <div>Type de programme non supporte</div>
}


function EditerProgrammeHumidificateur(props) {

    const { appareil, programmeId, args, setArgs, listeSenseurs } = props

    const humiditeChangeHandler = useCallback(event=>{
        const humidite = event.currentTarget.value
        setArgs({...args, humidite})
    }, [args, setArgs])
    const precisionChangeHandler = useCallback(event=>{
        const precision = event.currentTarget.value
        setArgs({...args, precision})
    }, [args, setArgs])
    const dureeOnMinChangeHandler = useCallback(event=>{
        const valeur = event.currentTarget.value
        setArgs({...args, duree_on_min: valeur})
    }, [args, setArgs])
    const dureeOffMinChangeHandler = useCallback(event=>{
        const valeur = event.currentTarget.value
        setArgs({...args, duree_off_min: valeur})
    }, [args, setArgs])

    const humiditeValeur = args.humidite || ''
    const precisionValeur = args.precision || ''
    const dureeOnMinValeur = args.duree_on_min || ''
    const dureeOffMinValeur = args.duree_off_min || ''

    useEffect(()=>{
        if(Object.values(args).length > 0) return  // Deja initialise
        // Injecte valeurs par defaut
        setArgs({humidite: 50.0, precision: 2.0, duree_on_min: 120, duree_off_min: 60})
    }, [args, setArgs])

    return (
        <div>

            <Form.Group as={Row} className="mb-3" controlId={"senseur-" + programmeId}>
                <Form.Label column xs={12} md={5}>Senseur d'humidite</Form.Label>
                <Col xs={12} md={7}>
                    <ListeDevicesOptions 
                        appareil={appareil} 
                        devices={listeSenseurs} 
                        typeDevice='humidite' 
                        value={'todo'} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"switch-" + programmeId}>
                <Form.Label column xs={12} md={5}>Switch</Form.Label>
                <Col xs={12} md={7}>
                    <ListeDevicesOptions 
                        appareil={appareil} 
                        devices={listeSenseurs} 
                        typeDevice='switch' 
                        local={true} 
                        value={'todo'} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"humidite-" + programmeId}>
                <Form.Label column xs={8} md={4}>Humidite (%)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='number'
                        value={humiditeValeur} 
                        onChange={humiditeChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"precision-" + programmeId}>
                <Form.Label column xs={8} md={4}>Precision (+/- %)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='number'
                        value={precisionValeur} 
                        onChange={precisionChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"dureeonmin-" + programmeId}>
                <Form.Label column xs={8} md={4}>Duree ON minimum (secondes)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='number'
                        value={dureeOnMinValeur} 
                        onChange={dureeOnMinChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"dureeoffmin-" + programmeId}>
                <Form.Label column xs={8} md={4}>Duree OFF minimum (secondes)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='number'
                        value={dureeOffMinValeur} 
                        onChange={dureeOffMinChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

        </div>
    )

}

function EditerProgrammeTimer(props) {
    const { appareil, programmeId, args, setArgs, listeSenseurs } = props

    const ajouterHeureHandler = useCallback(()=>{
        const horaire = args.horaire || []
        const horaireMaj = [...horaire, {etat: 0, heure: 8, minute: 0}]
        setArgs({...args, horaire: horaireMaj})
    }, [args, setArgs])

    const retirerHeureHandler = useCallback( e => {
        const ligneNo = Number.parseInt(e.currentTarget.value)
        const horaireMaj = args.horaire.filter((_, idx)=>idx!==ligneNo)
        setArgs({...args, horaire: horaireMaj})
    }, [args, setArgs])

    const onChangeHandler = useCallback( e => {
        const { name, checked, value } = e.currentTarget
        const [ champ, idx ] = name.split('_')
        
        // Copier horaire
        const horaireMaj = [...args.horaire]

        // Copier ligne avec nouvelle valeur
        if(champ === 'etat') horaireMaj[idx] = {...horaireMaj[idx], [champ]: (checked===true)?1:0}
        else horaireMaj[idx] = {...horaireMaj[idx], [champ]: value}

        setArgs({...args, horaire: horaireMaj})

    }, [args, setArgs])

    const horaire = args.horaire || []

    return (
        <div>

            <Form.Group as={Row} className="mb-3" controlId={"switch-" + programmeId}>
                <Form.Label column xs={12} md={5}>Switch</Form.Label>
                <Col xs={12} md={7}>
                    <ListeDevicesOptions 
                        appareil={appareil} 
                        devices={listeSenseurs} 
                        typeDevice='switch' 
                        local={true} 
                        value={'todo'} />
                </Col>
            </Form.Group>

            <h3>Horaire</h3>

            <EditerHoraire 
                horaire={horaire}
                ajouter={ajouterHeureHandler}
                retirer={retirerHeureHandler}
                onChange={onChangeHandler}
                />

        </div>
    )
}

function ListeDevicesOptions(props) {
    const { appareil, devices, value, typeDevice, local } = props

    const liste = useMemo(()=>{
        const uuid_appareil = appareil.uuid_appareil

        let listeFiltree = devices.filter(item=>item.type === typeDevice)
        if(local === true) {
            listeFiltree = listeFiltree.filter(item=>{
                const [uuid_appareil_senseur, nom_senseur] = item.value.split(':')
                return uuid_appareil_senseur === uuid_appareil
            })
        }

        return listeFiltree.map(item=>{
            const [uuid_appareil_senseur, nom_senseur] = item.value.split(':')
            let value_senseur = item.value
            if(uuid_appareil_senseur === uuid_appareil) value_senseur = nom_senseur
            return (
                <option key={item.value} value={value_senseur}>{item.name}</option>
            )
        })
    }, [appareil, devices, value])

    return (
        <Form.Select>
            <option>Choisissez une valeur</option>
            {liste}
        </Form.Select>
    )
}

function EditerHoraire(props) {

    const { horaire, ajouter, retirer, onChange } = props

    return (
        <div>
            <Button onClick={ajouter}>Ajouter heure</Button>
            {horaire.length>0?
                <Row>
                    <Col xs={2} sm={1}></Col>
                    <Col xs={2} sm={1}>ON/OFF</Col>
                    <Col xs={2} sm={1}>Heure</Col>
                    <Col xs={2} sm={1}>Minutes</Col>
                    <Col xs={2} sm={1}>Jour</Col>
                </Row>
            :''}
            <EditerHeures horaire={horaire} retirer={retirer} onChange={onChange} />
        </div>
    )
}

function EditerHeures(props) {
    const { horaire, retirer, onChange } = props

    if(horaire.length === 0) return ''

    return horaire.map((item, idx)=>{
        return (
            <Row key={idx}>
                <Col xs={2} sm={1}>
                    <Button variant="danger" onClick={retirer} value={''+idx}>X</Button>
                </Col>
                <Col xs={2} sm={1}>
                    <Form.Check id={'etat_'+idx} type="switch" name={'etat_'+idx} checked={item.etat === 1} onChange={onChange} />
                </Col>
                <Col xs={2} sm={1}>
                    <Form.Control 
                        type='text' 
                        name={'heure_'+idx} 
                        value={item.heure} 
                        onChange={onChange} />
                </Col>
                <Col xs={2} sm={1}>
                    <Form.Control 
                        type='text' 
                        name={'minute_'+idx} 
                        value={item.minute} 
                        onChange={onChange} />
                </Col>
                <Col xs={2} sm={1}>{item.jour_semaine}</Col>
            </Row>
        )
    })
}
