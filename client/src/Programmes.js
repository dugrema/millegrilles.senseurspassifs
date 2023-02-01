import { lazy, useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { v1 as uuidv1 } from 'uuid'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, {useEtatPret} from './WorkerContext'
import { mergeAppareil } from './redux/appareilsSlice'

export function ListeProgrammes(props) {
    const { show, appareil, setProgrammeEdit, supprimer } = props
    
    const ajouterHandler = useCallback(()=>setProgrammeEdit(true), [setProgrammeEdit])

    const programmes = useMemo(()=>{
        const configuration = appareil.configuration || {}
        const programmes = configuration.programmes || {}
        return Object.values(programmes)
    }, [appareil])

    if(!show) return ''

    return (
        <>
            <h3>Programmes et notifications</h3>
            <p>
                <Button variant="secondary" onClick={ajouterHandler}>Ajouter</Button>
            </p>
            {
                programmes.map(item=>(
                    <InfoProgramme 
                        key={item.programme_id} 
                        value={item} 
                        setEdit={setProgrammeEdit} 
                        supprimer={supprimer} />
                ))
            }
        </>
        
    )
}

export function EditProgramme(props) {
    const { appareil, programmeEdit, fermer, sauvegarder, listeSenseurs } = props

    const etatPret = useEtatPret()

    const [configurationAppareil, programmeInformation] = useMemo(()=>{
        const configuration = appareil.configuration || {}
        const programmes = configuration.programmes || {}
        let programmeInformation = {}
        if(programmeEdit !== true) {
            programmeInformation = programmes[programmeEdit]
            console.debug("Charger programme %s : %O (programmes %O)", programmeEdit, programmeInformation, programmes)
        }
        return [configuration, programmeInformation]
    }, [appareil, programmeEdit])

    const programmeId = useMemo(()=>{
        if(programmeInformation.programme_id) return programmeInformation.programme_id
        // Generer nouvel identificateur
        return ''+uuidv1()
    }, [programmeInformation])

    const nomAppareil = configurationAppareil.descriptif || configurationAppareil.uuid_appareil

    const [actif, setActif] = useState(programmeInformation.actif?true:false)
    const actifChangeHandler = useCallback(event => setActif(event.currentTarget.checked), [setActif])

    const [descriptif, setDescriptif] = useState(programmeInformation.descriptif?programmeInformation.descriptif:programmeId)
    const setDescriptifHandler = useCallback(event=>setDescriptif(event.currentTarget.value), [setDescriptif])

    const [classeProgramme, setClasseProgramme] = useState(programmeInformation.class||'')

    const [argsProgramme, setArgsProgramme] = useState(programmeInformation.args||{})

    useEffect(()=>{
        if(programmeInformation.programme_id) return
        // Set valeurs initiales
        setActif(true)
    }, [programmeInformation, setActif])

    const changeClasseHandler = useCallback(event => {
        const value = event.currentTarget.value
        console.debug('changeClasseHandler Nouvelle classe : %s', value)
        setClasseProgramme(value)
        setArgsProgramme({})
    }, [setClasseProgramme, setArgsProgramme])

    const sauvegarderHandler = useCallback(()=>{
        const config = {
            programme_id: programmeId,
            descriptif,
            class: classeProgramme,
            actif,
            args: argsProgramme
        }
        sauvegarder(config)
    }, [programmeId, descriptif, classeProgramme, actif, argsProgramme, sauvegarder])

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

            <Form.Group as={Row} className="mb-3" controlId="formHorizontalDescriptif">
                <Form.Label column xs={12} md={5}>
                    Actif
                </Form.Label>
                <Col>
                    <Form.Check id='actif' type="switch" checked={actif} onChange={actifChangeHandler} />
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
                    <Button onClick={sauvegarderHandler} disabled={!etatPret}>Sauvegarder</Button>
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

    const senseurChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const senseurs = []
        if(value) senseurs.push(value)
        setArgs({...args, senseurs_humidite: senseurs})
    }, [args, setArgs])

    const switchChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const switches = []
        if(value) switches.push(value)
        setArgs({...args, switches_humidificateurs: switches})
    }, [args, setArgs])

    const humiditeChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {decimal: true, min: 0, max: 100})
        if(val || !isNaN(val) || val === '') setArgs({...args, humidite: val})
    }, [args, setArgs])

    const precisionChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {decimal: true, min: 0, max: 100})
        if(val || !isNaN(val) || val === '') setArgs({...args, precision: val})
    }, [args, setArgs])

    const dureeOnMinChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {min: 0})
        if(val || !isNaN(val) || val === '') setArgs({...args, duree_on_min: val})
    }, [args, setArgs])

    const dureeOffMinChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {min: 0})
        if(val || !isNaN(val) || val === '') setArgs({...args, duree_off_min: val})
    }, [args, setArgs])

    useEffect(()=>{
        if(Object.values(args).length > 0) return  // Deja initialise
        // Injecte valeurs par defaut
        setArgs({humidite: 50.0, precision: 2.0, duree_on_min: 120, duree_off_min: 60})
    }, [args, setArgs])

    let senseurHumidite = ''
    if(args.senseurs_humidite && args.senseurs_humidite.length > 0) senseurHumidite = args.senseurs_humidite[0]

    let switchHumidificateur = ''
    if(args.switches_humidificateurs && args.switches_humidificateurs.length > 0) switchHumidificateur = args.switches_humidificateurs[0]

    const humiditeValeur = !isNaN(args.humidite)?args.humidite:''
    const precisionValeur = !isNaN(args.precision)?args.precision:''
    const dureeOnMinValeur = !isNaN(args.duree_on_min)?args.duree_on_min:''
    const dureeOffMinValeur = !isNaN(args.duree_off_min)?args.duree_off_min:''

    return (
        <div>

            <Form.Group as={Row} className="mb-3" controlId={"senseur-" + programmeId}>
                <Form.Label column xs={12} md={5}>Senseur d'humidite</Form.Label>
                <Col xs={12} md={7}>
                    <ListeDevicesOptions 
                        appareil={appareil} 
                        devices={listeSenseurs} 
                        typeDevice='humidite' 
                        value={senseurHumidite}
                        onChange={senseurChangeHandler} />
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
                        value={switchHumidificateur}
                        onChange={switchChangeHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"humidite-" + programmeId}>
                <Form.Label column xs={8} md={4}>Humidite (%)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='decimal'
                        value={humiditeValeur} 
                        onChange={humiditeChangeHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"precision-" + programmeId}>
                <Form.Label column xs={8} md={4}>Precision (+/- %)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='decimal'
                        value={precisionValeur} 
                        onChange={precisionChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"dureeonmin-" + programmeId}>
                <Form.Label column xs={8} md={4}>Duree ON minimum (secondes)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='numeric'
                        value={dureeOnMinValeur} 
                        onChange={dureeOnMinChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"dureeoffmin-" + programmeId}>
                <Form.Label column xs={8} md={4}>Duree OFF minimum (secondes)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='numeric'
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

    const switchChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const switches = []
        if(value) switches.push(value)
        setArgs({...args, switches})
    }, [args, setArgs])

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
        let valueAjustee = value
        switch(champ) {
            case 'etat':
                valueAjustee = (checked===true)?1:0
                break
            case 'heure':
                valueAjustee = validateNumber(value, {min: 0, max: 23})
                break
            case 'minute':
                valueAjustee = validateNumber(value, {min: 0, max: 59})
                break
            default:
        }

        if(valueAjustee !== null) {
            horaireMaj[idx] = {...horaireMaj[idx], [champ]: valueAjustee}
            setArgs({...args, horaire: horaireMaj})
        }

    }, [args, setArgs])

    const horaire = args.horaire || []
    let switchTimer = ''
    if(args.switches && args.switches.length > 0) switchTimer = args.switches[0]

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
                        value={switchTimer} 
                        onChange={switchChangeHandler} />
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
    const { appareil, devices, value, typeDevice, local, onChange } = props

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
        <Form.Select value={value} onChange={onChange}>
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
                        inputMode='numeric'
                        name={'heure_'+idx} 
                        value={item.heure} 
                        onChange={onChange} />
                </Col>
                <Col xs={2} sm={1}>
                    <Form.Control 
                        type='text' 
                        inputMode='numeric'
                        name={'minute_'+idx} 
                        value={item.minute} 
                        onChange={onChange} />
                </Col>
                <Col xs={2} sm={1}>{item.jour_semaine}</Col>
            </Row>
        )
    })
}

function InfoProgramme(props) {
    const { value, setEdit, supprimer } = props

    const editHandler = useCallback(()=>setEdit(value.programme_id), [value, setEdit])

    const nomClasse = value.class.split('.').pop()

    return (
        <Row>
            <Col xs={2} md={1}>
                <Button variant='secondary' onClick={editHandler}>Editer</Button>
            </Col>
            <Col xs={10} md={4}>{nomClasse}</Col>
            <Col xs={10} md={6}>{value.descriptif || value.programme_id}</Col>
            <Col xs={2} md={1}>
                <Button variant='danger' onClick={supprimer} value={value.programme_id}>X</Button>
            </Col>
        </Row>
    )
}

function validateNumber(val, opts) {
    opts = opts || {}
    const decimal = opts.decimal === true,
          negative = opts.negative === true,
          min = opts.min,
          max = opts.max
    if(val !== '') {
        if(decimal) {
            if(val[val.length-1] === '.') return val
        }
        if(negative && val.length===1) {
            if(val[0] === '-') return val
        }
        
        val = Number.parseFloat(val)

        if(isNaN(val)) val = ''
        else {
            // Valider min et max
            if(!isNaN(min) && val < min) val = null
            if(!isNaN(max) && val > max) val = null
        }
    }

    return val
}
