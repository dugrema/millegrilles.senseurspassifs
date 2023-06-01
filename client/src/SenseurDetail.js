import { useState, useEffect, useCallback, useMemo } from 'react'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import Datetime from 'react-datetime'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers from './WorkerContext'

const DATETIME_DATE_FORMAT = 'YYYY-MM-DD'
const DATETIME_TIME_FORMAT = 'HH:mm:ss'

function SenseurDetail(props) {

    const { senseurId, fermer, appareil } = props
    
    const configuration = appareil.configuration || {}
    const uuid_appareil = appareil.uuid_appareil
    const descriptifAppareil = configuration.descriptif || uuid_appareil
    const descriptif_senseurs = configuration.descriptif_senseurs || {}
    const descriptifSenseur = descriptif_senseurs[senseurId] || senseurId
    const senseurs = appareil.senseurs || {}
    const senseurLectureCourante = senseurs[senseurId] || {}
    const timestampCourant = senseurLectureCourante.timestamp || ''
    const typeValeur = senseurLectureCourante.type
    const valeur = senseurLectureCourante.valeur

    return (
        <div>
            <Row>
                <Col xs={8} md={10} lg={11}><h2>Statistiques {descriptifAppareil}</h2></Col>
                <Col>
                    <Button variant="secondary" onClick={fermer}>X</Button>
                </Col>
            </Row>

            <h3>Senseur {descriptifSenseur}</h3>

            <Row>
                <Col xs={6} md={3} xl={2}>Derniere lecture</Col>
                <Col><FormatterDate value={timestampCourant} /></Col>
            </Row>
            <Row>
                <Col xs={6} md={3} xl={2}>Valeur</Col>
                <Col>
                    {valeur?
                        <FormatterValeur valeur={valeur} typeValeur={typeValeur} />
                        :
                        senseurLectureCourante.valeur_str
                    }
                </Col>
            </Row>

            <p></p>

            <StatisquesSenseur 
                appareil={appareil} 
                senseurId={senseurId} 
                typeValeur={typeValeur} />

        </div>
    )
}

export default SenseurDetail

function StatisquesSenseur(props) {

    const { appareil, senseurId, typeValeur } = props
    const uuid_appareil = appareil.uuid_appareil

    const workers = useWorkers()
    
    const [stats, setStats] = useState('')
    const [timezone, setTimezone] = useState('America/Montreal')
    const setTimezoneHandler = useCallback(e=>setTimezone(e.currentTarget.value), [setTimezone])

    const [grouping, setGrouping] = useState('')
    const [minDate, setMinDate] = useState('')
    const [maxDate, setMaxDate] = useState('')

    const groupingHandler = useCallback(e=>setGrouping(e.currentTarget.value), [setGrouping])

    useEffect(()=>{
        if(!uuid_appareil || !senseurId) return
        console.debug("Charger statistiques senseur %s appareil %s", senseurId, uuid_appareil)
        let requete = { senseur_id: senseurId, uuid_appareil, timezone }
        if(grouping && minDate) {
            requete = {
                ...requete, 
                custom_grouping: grouping, 
                custom_intervalle_min: Math.round(minDate.getTime()/1000), 
            }
            if(maxDate) {
                requete.custom_intervalle_max = Math.round(maxDate.getTime()/1000)
            }
        }
        workers.connexion.getStatistiquesSenseur(requete)
            .then(reponse=>{
                console.debug("Reponse statistiques ", reponse)
                setStats(reponse)
            })
            .catch(err=>console.error("Erreur chargement statistiques ", err))
    }, [workers, uuid_appareil, senseurId, setStats, timezone, grouping, minDate, maxDate])

    if(!appareil || !senseurId) return ''

    return (
        <div>
            <h3>Statistiques</h3>

            <Form.Group as={Row} className="mb-3" controlId="formTz">
                <Form.Label column xs={12} md={5}>
                    Timezone
                </Form.Label>
                <Col>
                    <TimezoneSelect value={timezone} onChange={setTimezoneHandler} />
                </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId="formTz">
                <Form.Label column xs={12} md={5}>
                    Type rapport
                </Form.Label>
                <Col>
                    <Form.Select value={grouping} onChange={groupingHandler}>
                        <option value=''>Tables en cannes</option>
                        <option value='heures'>Heures</option>
                        <option value='jours'>Jours</option>
                    </Form.Select>
                </Col>
            </Form.Group>

            <StatistiquesTableCustom 
                liste={stats.custom} 
                typeValeur={typeValeur} 
                grouping={grouping}
                setGrouping={setGrouping}
                minDate={minDate}
                setMinDate={setMinDate}
                maxDate={maxDate}
                setMaxDate={setMaxDate}
                />

            <StatistiquesTable72h liste={stats.periode72h} typeValeur={typeValeur} />

            <StatistiquesTable31j liste={stats.periode31j} typeValeur={typeValeur} />

            <p></p>
        </div>
    )
}

function StatistiquesTable72h(props) {
    const {liste, typeValeur} = props

    if(!liste) return ''

    let jour = ''

    const [_, unite] = getUnite(typeValeur)

    return (
        <div>
            <h3>Table statistiques 3 jours</h3>
            <Row>
                <Col xs={4} md={2} className='text-overflow-clip'>
                    Date
                </Col>
                <Col md={2} className='d-none d-md-block'>
                    Heure
                </Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Moyenne</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Maximum</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Minimum</Col>
            </Row>
            <ListeHeures liste={liste} typeValeur={typeValeur} />
        </div>
    )

}

function StatistiquesTable31j(props) {
    const {liste, typeValeur} = props

    if(!liste) return ''

    return (
        <div>
            <h3>Table statistiques 31 jours</h3>
            <Row>
                <Col xs={4} md={4} xl={3} className='text-overflow-clip'>Jour</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Moyenne</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Maximum</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Minimum</Col>
            </Row>
            <ListeJours liste={liste} typeValeur={typeValeur} />
        </div>
    )

}

function ListeHeures(props) {
    const { liste, typeValeur } = props

    const unite = useMemo(()=>{
        const [_, unite] = getUnite(typeValeur)
        return unite
    }, [typeValeur])

    if(!liste) return ''

    let jour = ''

    return liste.map(item=>{
        let jourItem = new Date(item.heure * 1000).getDay()
        if(jourItem === jour) {
            jourItem = null
        } else {
            jour = jourItem
        }

        return (
            <div key={item.heure}>
                {jourItem?
                    <Row>
                        <Col className='d-md-none'>
                            <FormatterDate format='YYYY/MM/DD' value={item.heure} />
                        </Col>
                    </Row>
                :''}
                <Row>
                    <Col className='d-none d-md-block' md={2}>
                        {jourItem?
                            <FormatterDate format='YYYY/MM/DD' value={item.heure} />
                        :''}
                    </Col>
                    <Col xs={4} md={2}><FormatterDate format='HH:mm:ss' value={item.heure} /></Col>
                    <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.avg} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.max} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.min} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} lg={1}>{unite}</Col>
                </Row>
            </div>
        )
    })
}

function ListeJours(props) {
    const { liste, typeValeur } = props

    const unite = useMemo(()=>{
        const [_, unite] = getUnite(typeValeur)
        return unite
    }, [typeValeur])

    if(!liste) return ''

    return liste.map(item=>(
        <Row key={item.heure}>
            <Col xs={4} md={4} xl={3}><FormatterDate value={item.heure} format="YYYY/MM/DD" /></Col>
            <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.avg} typeValeur={typeValeur} hideType={true} /></Col>
            <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.max} typeValeur={typeValeur} hideType={true} /></Col>
            <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.min} typeValeur={typeValeur} hideType={true} /></Col>
            <Col xs={2} lg={1}>{unite}</Col>
        </Row>
    ))
}

function StatistiquesTableCustom(props) {
    const {
        liste, typeValeur,
        grouping, setGrouping,
        minDate, setMinDate,
        maxDate, setMaxDate,
    } = props

    // let jour = ''

    // const [_, unite] = getUnite(typeValeur)

    const [dateDebut, setDateDebut] = useState('')
    const [dateFin, setDateFin] = useState('')

    useEffect(()=>{
        const now = new Date()
        now.setMinutes(0)
        now.setSeconds(0)
        const dateMin = new Date(now.getTime() - (7000 * 86400))
        setDateDebut(dateMin)
        setMinDate(dateMin)
        setDateFin(now)
        setMaxDate(now)
    }, [setDateDebut, setDateFin])

    const FormatteurListe = useMemo(()=>{
        let Formatteur = null
        switch(grouping) {
            case 'jours': Formatteur = ListeJours; break
            default:
                Formatteur = ListeHeures
        }
        return Formatteur
    }, [grouping])

    const dateDebutChangeHandler = useCallback(e=>setDateDebut(e), [setDateDebut])
    const dateFinChangeHandler = useCallback(e=>setDateFin(e), [setDateFin])
    const dateMinChangeHandler = useCallback(e=>{
        console.debug("Date debut ", e)
        setMinDate(e.toDate())
    }, [setMinDate])
    const dateMaxChangeHandler = useCallback(e=>setMaxDate(e.toDate()), [setMaxDate])

    if(!liste) return ''

    return (
        <div>
            <h3>Statistiques sur mesure</h3>

            {grouping?(
                <div>
                    <Row>
                        <Col xs={12} sm={4}>Date debut</Col>
                        <Col>
                            <Datetime 
                                value={dateDebut} 
                                onChange={dateDebutChangeHandler} 
                                onClose={dateMinChangeHandler} 
                                dateFormat={DATETIME_DATE_FORMAT}
                                timeFormat={DATETIME_TIME_FORMAT} />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} sm={4}>Date fin</Col>
                        <Col>
                            <Datetime 
                                value={dateFin} 
                                onChange={dateFinChangeHandler} 
                                onClose={dateMaxChangeHandler} 
                                dateFormat={DATETIME_DATE_FORMAT}
                                timeFormat={DATETIME_TIME_FORMAT} />
                        </Col>
                    </Row>

                    <Row>
                        <Col xs={4} md={4} xl={3} className='text-overflow-clip'>Date</Col>
                        <Col xs={2} lg={1} className='text-overflow-clip'>Moyenne</Col>
                        <Col xs={2} lg={1} className='text-overflow-clip'>Maximum</Col>
                        <Col xs={2} lg={1} className='text-overflow-clip'>Minimum</Col>
                    </Row>
                </div>
            ):''}

            <div className='wrap-rapport'>
                <FormatteurListe liste={liste} typeValeur={typeValeur} />
            </div>

        </div>
    )

}

function FormatterValeur(props) {
    const {valeur, typeValeur, hideType} = props
    if(isNaN(valeur)) return ''

    let [decimals, unite] = getUnite(typeValeur)
    if(hideType) unite = ''

    if(!isNaN(decimals)) {
        return <span>{valeur.toFixed(decimals)} {unite}</span>
    } else {
        return valeur + unite
    }
}

function getUnite(typeValeur) {
    let decimals = null, unite = ''
    switch(typeValeur) {
        case 'temperature': decimals = 1; unite = <span>&deg;C</span>; break
        case 'humidite': decimals = 1; unite = '%'; break
        case 'pression': decimals = 0; unite = 'hPa'; break
        default:
    }
    return [decimals, unite]
}

const TIMEZONES = [
    'America/Montreal',
    'America/Toronto'
]

function TimezoneOptions(props) {
    return TIMEZONES.map(item=>{
        return (
            <option key={item} value={item}>{item}</option>
        )
    })
}

function TimezoneSelect(props) {
    const { value, onChange } = props

    return (
        <Form.Select value={value} onChange={onChange}>
            <option>Selectionner une timezone</option>
            <TimezoneOptions />
        </Form.Select>
    )
}

