import { useState, useCallback, useMemo, useEffect } from 'react'
import { v1 as uuidv1 } from 'uuid'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Alert from 'react-bootstrap/Alert'

import {useEtatPret} from './WorkerContext'

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

function InfoProgramme(props) {
    const { value, setEdit, supprimer } = props

    const editHandler = useCallback(()=>setEdit(value.programme_id), [value, setEdit])

    const nomClasse = value.class.split('.').pop()

    return (
        <Row>
            <Col xs={3} sm={2} lg={1}>
                <Button variant='secondary' onClick={editHandler}>Editer</Button>
            </Col>
            <Col md={3} className='d-none d-md-block'>{nomClasse}</Col>
            <Col xs={7} sm={8} md={6}>
                {value.descriptif || value.programme_id}
                {' '}
                {value.actif===true?'(ON)':'(OFF)'}
            </Col>
            <Col xs={2} sm={2} md={1}>
                <Button variant='danger' onClick={supprimer} value={value.programme_id}>X</Button>
            </Col>
        </Row>
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
            // console.debug("Charger programme %s : %O (programmes %O)", programmeEdit, programmeInformation, programmes)
        }
        return [configuration, programmeInformation]
    }, [appareil, programmeEdit])

    const [programmeId, setProgrammeId] = useState(programmeInformation.programme_id?''+programmeInformation.programme_id:'')

    const nomAppareil = configurationAppareil.descriptif || configurationAppareil.uuid_appareil

    const [actif, setActif] = useState(programmeInformation.actif?true:false)
    const actifChangeHandler = useCallback(event => setActif(event.currentTarget.checked), [setActif])

    const [descriptif, setDescriptif] = useState(programmeInformation.descriptif?programmeInformation.descriptif:programmeId)
    const setDescriptifHandler = useCallback(event=>setDescriptif(event.currentTarget.value), [setDescriptif])

    const [classeProgramme, setClasseProgramme] = useState(programmeInformation.class||'')

    const [argsProgramme, setArgsProgramme] = useState(programmeInformation.args||{})

    useEffect(()=>{
        if(programmeId) return
        // Generer nouvel identificateur
        const programmeIdNouveau = ''+uuidv1()
        setProgrammeId(programmeIdNouveau)
        setDescriptif(programmeIdNouveau)
    }, [programmeId, setProgrammeId, setDescriptif])

    useEffect(()=>{
        if(programmeInformation.programme_id) return
        // Set valeurs initiales
        setActif(true)
    }, [programmeInformation, setActif])

    const changeClasseHandler = useCallback(event => {
        const value = event.currentTarget.value
        // console.debug('changeClasseHandler Nouvelle classe : %s', value)
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

            <Row>
                <Col xs={12} md={5}>Programme id</Col>
                <Col>{programmeId}</Col>
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
                    <ProgrammesSelect nouveau={programmeEdit===true} classeProgramme={classeProgramme} onChange={changeClasseHandler} />
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

            <p></p>

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

    const { classeProgramme, nouveau, onChange } = props

    if(nouveau !== true) {
        return <OptionsProgrammes readonly={true} value={classeProgramme} />
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

        const programmesFiltres = programmes.filter(item=>item.class===value)
        // console.debug("Programmes nomClasse = %s, programmes %O", value, programmesFiltres)
        const programme = programmesFiltres.pop()
        return <span>{programme.nom}</span>
    }

    return programmes.map(item=>{
        return (
            <option key={item.nom} value={item['class']||''}>{item.nom}</option>
        )
    })
}

function getProgrammesDisponibles() {
    return [
        { nom: 'Humidificateur', 'class': 'programmes.environnement.Humidificateur' },
        { nom: 'Horaire', 'class': 'programmes.horaire.HoraireHebdomadaire' },
        { nom: 'Horaire (Obsolete, <2024.0)', 'class': 'programmes.timers.TimerHebdomadaire' },
        { nom: 'Timer', 'class': 'programmes.horaire.Timer' },
        { nom: 'Chauffage', 'class': 'programmes.environnement.Chauffage' },
        { nom: 'Climatisation/Refrigeration', 'class': 'programmes.environnement.Climatisation' },
        { nom: 'Notification Temperature', 'class': 'programmes.notifications.NotificationTemperature' },
        { nom: 'Notification Humidite', 'class': 'programmes.notifications.NotificationHumidite' },
        { nom: 'Notification Pression Tendance', 'class': 'programmes.notifications.NotificationPressionTendance' },
    ]
}

function ConfigurerProgramme(props) {

    const { appareil, programmeId, classeProgramme, args, setArgs, listeSenseurs } = props

    if(!classeProgramme) return ''

    let ClasseEditeur = null,
        uniteElem = '',
        typeDevice = '',
        valeurMin = 0,
        valeurMax = 100
    switch(classeProgramme) {
        case 'programmes.environnement.Humidificateur': ClasseEditeur = EditerProgrammeHumidificateur; break
        case 'programmes.horaire.HoraireHebdomadaire': ClasseEditeur = EditerProgrammeHoraireHebdomadaire; break
        case 'programmes.timers.TimerHebdomadaire': ClasseEditeur = EditerProgrammeHorairePre2024; break
        case 'programmes.horaire.Timer': ClasseEditeur = EditerProgrammeTimer; break
        case 'programmes.environnement.Chauffage':
        case 'programmes.environnement.Climatisation':
            ClasseEditeur = EditerProgrammeTemperature; break
        case 'programmes.notifications.NotificationTemperature':
            if(!uniteElem) { typeDevice = 'temperature'; uniteElem = <span>&deg;C</span> }
        case 'programmes.notifications.NotificationHumidite':
            if(!uniteElem) { typeDevice = 'humidite'; uniteElem = <span>%</span> }
        case 'programmes.notifications.NotificationPressionTendance':
            if(!uniteElem) {
                typeDevice = 'pression_tendance'
                uniteElem = <span>Pa</span>
                valeurMin = -106000
                valeurMax = 106000
            }
            ClasseEditeur = EditerNotificationValeur; break
        default: ClasseEditeur = EditerProgrammeNonSupporte
    }

    return (
        <ClasseEditeur 
            appareil={appareil}
            programmeId={programmeId}
            args={args}
            setArgs={setArgs}
            listeSenseurs={listeSenseurs}
            uniteElem={uniteElem}
            valeurMin={valeurMin}
            valeurMax={valeurMax}
            typeDevice={typeDevice}
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

function EditerProgrammeTemperature(props) {

    const { appareil, programmeId, args, setArgs, listeSenseurs } = props

    const senseurChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const senseurs = []
        if(value) senseurs.push(value)
        setArgs({...args, senseurs: senseurs})
    }, [args, setArgs])

    const switchChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const switches = []
        if(value) switches.push(value)
        setArgs({...args, switches: switches})
    }, [args, setArgs])

    const temperatureChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {decimal: true, min: -80, max: 80})
        if(val || !isNaN(val) || val === '') setArgs({...args, temperature: val})
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
        setArgs({temperature: 20.0, precision: 1.0, duree_on_min: 120, duree_off_min: 60})
    }, [args, setArgs])

    let senseur = ''
    if(args.senseurs && args.senseurs.length > 0) senseur = args.senseurs[0]

    let switchTemp = ''
    if(args.switches && args.switches.length > 0) switchTemp = args.switches[0]

    const temperatureValeur = !isNaN(args.temperature)?args.temperature:''
    const precisionValeur = !isNaN(args.precision)?args.precision:''
    const dureeOnMinValeur = !isNaN(args.duree_on_min)?args.duree_on_min:''
    const dureeOffMinValeur = !isNaN(args.duree_off_min)?args.duree_off_min:''

    return (
        <div>

            <Form.Group as={Row} className="mb-3" controlId={"senseur-" + programmeId}>
                <Form.Label column xs={12} md={5}>Senseur de temperature</Form.Label>
                <Col xs={12} md={7}>
                    <ListeDevicesOptions 
                        appareil={appareil} 
                        devices={listeSenseurs} 
                        typeDevice='temperature' 
                        value={senseur}
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
                        value={switchTemp}
                        onChange={switchChangeHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"temperature-" + programmeId}>
                <Form.Label column xs={8} md={4}>Temperature (C)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='decimal'
                        value={temperatureValeur} 
                        onChange={temperatureChangeHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"precision-" + programmeId}>
                <Form.Label column xs={8} md={4}>Precision (+/- C)</Form.Label>
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

function EditerNotificationValeur(props) {
    const { appareil, programmeId, args, setArgs, listeSenseurs, typeDevice } = props
    const valeurMin = props.valeurMin || -100
    const valeurMax = props.valeurMax || 100
    const uniteElem = props.uniteElem || ''

    const senseurChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const senseurs = []
        if(value) senseurs.push(value)
        setArgs({...args, senseurs: senseurs})
    }, [args, setArgs])

    const messageChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        setArgs({...args, message: value})
    }, [args, setArgs])

    const senseurValeurChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {decimal: true, min: valeurMin, max: valeurMax})
        if(val || !isNaN(val) || val === '') setArgs({...args, valeur: val})
    }, [args, setArgs])

    const precisionChangeHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {decimal: true, min: 0, max: 100})
        if(val || !isNaN(val) || val === '') setArgs({...args, precision: val})
    }, [args, setArgs])

    const reverseChangeHandler = useCallback(event => {
        const checked = event.currentTarget.checked
        setArgs({...args, reverse: checked})
    }, [args, setArgs])

    const intervalleEmissionHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {min: 0})
        if(val || !isNaN(val) || val === '') setArgs({...args, intervalle_emission: val})
    }, [args, setArgs])

    const intervalleReemissionHandler = useCallback(event=>{
        const value = event.currentTarget.value
        let val = validateNumber(value, {min: 0})
        if(val || !isNaN(val) || val === '') setArgs({...args, intervalle_reemission: val})
    }, [args, setArgs])

    useEffect(()=>{
        if(Object.values(args).length > 0) return  // Deja initialise
        // Injecte valeurs par defaut
        setArgs({valeur: 0.0, precision: 1.0, intervalle_emission: 120, intervalle_reemission: 3600})
    }, [args, setArgs])

    let senseur = ''
    if(args.senseurs && args.senseurs.length > 0) senseur = args.senseurs[0]

    let switchTemp = ''
    if(args.switches && args.switches.length > 0) switchTemp = args.switches[0]

    const message = args.message || ''
    const reverse = args.reverse || false
    const senseurValeur = !isNaN(args.valeur)?args.valeur:''
    const precisionValeur = !isNaN(args.precision)?args.precision:''
    const intervalleEmission = !isNaN(args.intervalle_emission)?args.intervalle_emission:''
    const intervalleReemission = !isNaN(args.intervalle_reemission)?args.intervalle_reemission:''

    return (
        <div>

            <Form.Group as={Row} className="mb-3" controlId={"senseur-" + programmeId}>
                <Form.Label column xs={12} md={5}>Senseur</Form.Label>
                <Col xs={12} md={7}>
                    <ListeDevicesOptions 
                        appareil={appareil} 
                        devices={listeSenseurs} 
                        typeDevice={typeDevice}
                        value={senseur}
                        onChange={senseurChangeHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"message-" + programmeId}>
                <Form.Label column xs={12} md={5}>Message</Form.Label>
                <Col xs={12} md={7}>
                    <Form.Control 
                        type='text'
                        value={message} 
                        onChange={messageChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
                <Form.Text>Utiliser {"{valeur}"} pour inclure la valeur courante du senseur dans le message.</Form.Text>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"valeur-" + programmeId}>
                <Form.Label column xs={8} md={4}>Valeur ({uniteElem})</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='decimal'
                        value={senseurValeur} 
                        onChange={senseurValeurChangeHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"precision-" + programmeId}>
                <Form.Label column xs={8} md={4}>Precision (+/- {uniteElem})</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='decimal'
                        value={precisionValeur} 
                        onChange={precisionChangeHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"reverse-" + programmeId}>
                <Form.Label column xs={12} md={5}>Declenchement</Form.Label>
                <Col xs={1} md={1}>
                    -
                </Col>
                <Col xs={2} md={1}>
                    <Form.Check id='reverse' type="switch" checked={reverse} onChange={reverseChangeHandler} />
                </Col>
                <Col xs={1} md={1}>
                    +
                </Col>
                <Form.Text>
                    OFF (-) : Notification active si lecture du senseur est inferieure a la valeur.<br/>
                    ON (+)  : Notification active si lecture du senseur est superieure a la valeur.
                </Form.Text>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"dureeonmin-" + programmeId}>
                <Form.Label column xs={8} md={4}>Intervalle minimal entre notifications (secondes)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='numeric'
                        value={intervalleEmission} 
                        onChange={intervalleEmissionHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId={"dureeoffmin-" + programmeId}>
                <Form.Label column xs={8} md={4}>Intervalle de rappel de notification (secondes)</Form.Label>
                <Col xs={4} md={2}>
                    <Form.Control 
                        type='text'
                        inputMode='numeric'
                        value={intervalleReemission} 
                        onChange={intervalleReemissionHandler}
                        autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                </Col>
            </Form.Group>

        </div>
    )
}

function EditerProgrammeHoraireHebdomadaire(props) {
    const { appareil, programmeId, args, setArgs, listeSenseurs } = props

    const switchChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const switches = []
        if(value) switches.push(value)
        setArgs({...args, switches})
    }, [args, setArgs])

    const [activationInitiale, setActivationInitiale] = useState(args.activationInitiale||false)
    const activationInitialeChangeHandler = useCallback(e=>{
        const checked = e.currentTarget.checked
        console.debug("activationInitialeChangeHandler checked %O", checked)
        const copieArgs = {...args, activationInitiale: checked}
        setActivationInitiale(checked)
        console.debug("Args modifies : %O", copieArgs)
        setArgs(copieArgs)
    }, [args, setArgs, setActivationInitiale])

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
            if(valueAjustee !== '') {
                horaireMaj[idx] = {...horaireMaj[idx], [champ]: valueAjustee}
            } else {
                horaireMaj[idx] = {...horaireMaj[idx], [champ]: undefined}
            }
            const argsMaj = {...args, horaire: horaireMaj}
            console.debug("Horaire maj : ", argsMaj)
            setArgs(argsMaj)
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

            <Form.Group as={Row} className="mb-3" controlId="activationInitiale">
                <Form.Label column xs={12} md={5}>
                    Activation initiale au redemarrage
                </Form.Label>
                <Col>
                    <Form.Check id='activationInitiale' type="switch" checked={activationInitiale} onChange={activationInitialeChangeHandler} />
                </Col>
            </Form.Group>

            <h3>Horaire</h3>

            <p>
                Notes
            </p>
            <ul>
                <li>Options solaires (dawn, sunrise, etc) vont ignorer l'heure. Il faut avoir fourni les coordonnées (géoposition) de l'appareil pour utiliser cette option. Les minutes sont optionnelles et utilisées comme offset (e.g. levé du soleil +10 minutes).</li>
                <li>Les jours de la semaine sont programmables un par un. Pour avoir un horaire du lundi au vendredi, il faut programmer chaque jour séparément. Noter que pour une lumière, il est possible de la faire fermer tous les jours mais juste allumer certains jours.</li>
                <li>L'ordre des lignes n'a pas d'importance.</li>
                <li>L'activation initiale au redémarrage détermine si la switch devrait être ON ou OFF lors du démarrage de l'appareil. Utile en cas de panne de courant.</li>
            </ul>

            <EditerHoraire 
                horaire={horaire}
                ajouter={ajouterHeureHandler}
                retirer={retirerHeureHandler}
                onChange={onChangeHandler}
                />

        </div>
    )
}

function EditerProgrammeHorairePre2024(props) {
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

            <Alert variant="warning">
                <Alert.Heading>Obsolete</Alert.Heading>
                <p>Obsolete, pre 2024.0. Ne pas utiliser avec des appareils post 2024.0</p>
            </Alert>

            <EditerHorairePre2024 
                horaire={horaire}
                ajouter={ajouterHeureHandler}
                retirer={retirerHeureHandler}
                onChange={onChangeHandler}
                />

        </div>
    )
}


function EditerHorairePre2024(props) {

    const { horaire, ajouter, retirer, onChange } = props

    return (
        <div>
            <Button variant='secondary' onClick={ajouter}>Ajouter heure</Button>
            {horaire.length>0?
                <Row>
                    <Col xs={2} sm={1}></Col>
                    <Col xs={3} sm={2} lg={1}>ON/OFF</Col>
                    <Col xs={3} sm={2} lg={1}>Heure</Col>
                    <Col xs={3} sm={2} lg={1}>Minutes</Col>
                </Row>
            :''}
            <EditerHeuresPre2024 horaire={horaire} retirer={retirer} onChange={onChange} />
        </div>
    )
}

function EditerHeuresPre2024(props) {
    const { horaire, retirer, onChange } = props

    if(horaire.length === 0) return ''

    return horaire.map((item, idx)=>{
        return (
            <Row key={idx}>
                <Col xs={2} sm={1}>
                    <Button variant="danger" onClick={retirer} value={''+idx}>X</Button>
                </Col>
                <Col xs={3} sm={2} lg={1}>
                    <Form.Check id={'etat_'+idx} type="switch" name={'etat_'+idx} checked={item.etat === 1} onChange={onChange} />
                </Col>
                <Col xs={3} sm={2} lg={1}>
                    <Form.Control 
                        type='text' 
                        inputMode='numeric'
                        name={'heure_'+idx} 
                        value={item.heure} 
                        onChange={onChange} />
                </Col>
                <Col xs={3} sm={2} lg={1}>
                    <Form.Control 
                        type='text' 
                        inputMode='numeric'
                        name={'minute_'+idx} 
                        value={item.minute} 
                        onChange={onChange} />
                </Col>
            </Row>
        )
    })
}

function EditerProgrammeTimer(props) {
    const { appareil, programmeId, args, setArgs, listeSenseurs } = props

    const switchChangeHandler = useCallback(e=>{
        const value = e.currentTarget.value
        const switches = []
        if(value) switches.push(value)
        setArgs({...args, switches})
    }, [args, setArgs])

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

            <h3>Timer</h3>
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
            <Button variant='secondary' onClick={ajouter}>Ajouter heure</Button>
            {horaire.length>0?
                <Row>
                    <Col xs={2} sm={1}></Col>
                    <Col className='d-none d-sm-block' sm={6}></Col>
                    <Col xs={3} sm={2} lg={1}>ON/OFF</Col>
                    <Col xs={3} sm={2} lg={1}>Heure</Col>
                    <Col xs={3} sm={2} lg={1}>Minutes</Col>
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
                <Col xs={5} sm={3}>
                    <SelectJoursSemaine name={'jour_'+idx} value={item.jour} onChange={onChange} />
                </Col>
                <Col xs={5} sm={3}>
                    <SelectHeureSolaire name={'solaire_'+idx} value={item.solaire} onChange={onChange} />
                </Col>

                <Col xs={2} className='d-sm-none'></Col>
                <Col xs={3} sm={1} lg={1}>
                    <Form.Check id={'etat_'+idx} type="switch" name={'etat_'+idx} checked={item.etat === 1} onChange={onChange} />
                </Col>
                <Col xs={3} sm={2} lg={1}>
                    <Form.Control 
                        type='text' 
                        inputMode='numeric'
                        name={'heure_'+idx} 
                        value={item.heure} 
                        onChange={onChange} />
                </Col>
                <Col xs={3} sm={2} lg={1}>
                    <Form.Control 
                        type='text' 
                        inputMode='numeric'
                        name={'minute_'+idx} 
                        value={item.minute} 
                        onChange={onChange} />
                </Col>
            </Row>
        )
    })
}

// Aligner sur Python - monday=0, sunday=6
const CONST_JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function SelectJoursSemaine(props) {
    const { name, value, onChange } = props

    const valueStr = value?''+value:''

    const jours = CONST_JOURS_SEMAINE.map((item, idx)=>{
        return <option key={''+idx} value={''+idx}>{item}</option>
    })
    return (
        <Form.Select name={name} value={valueStr} onChange={onChange}>
            <option value=''>Tous les jours</option>
            {jours}
        </Form.Select>
    )
}

const CONST_HEURE_SOLAIRE = ['dawn', 'sunrise', 'noon', 'sunset', 'dusk']

function SelectHeureSolaire(props) {
    const { name, value, onChange } = props

    const valueStr = value?''+value:''

    const jours = CONST_HEURE_SOLAIRE.map((item, idx)=>{
        return <option key={''+idx} value={item}>{item}</option>
    })
    return (
        <Form.Select name={name} value={valueStr} onChange={onChange}>
            <option value=''>Heure</option>
            {jours}
        </Form.Select>
    )
}

function validateNumber(val, opts) {
    opts = opts || {}
    const decimal = opts.decimal === true,
          min = opts.min,
          max = opts.max,
          negative = (opts.negative === true || min < 0.0)

    if(val !== '') {
        if(decimal) {
            if(val[val.length-1] === '.') return val
        }
        if(negative && val.length===1) {
            if(val[0] === '-') {
                return val
            }
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
