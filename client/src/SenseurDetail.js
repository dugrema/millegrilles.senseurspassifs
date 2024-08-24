import { useState, useEffect, useCallback, useMemo, lazy } from 'react'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import Datetime from 'react-datetime'

import PYTZ_TIMEZONES from '@dugrema/millegrilles.utiljs/res/pytz_timezones.json'
import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers from './WorkerContext'

const ChartTemperatures = lazy( () => import('./ChartTemperatures') )
const ChartHumidite = lazy( () => import('./ChartHumidite') )
const ChartPression = lazy( () => import('./ChartPression') )

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
    // const typeValeur = senseurLectureCourante.type

    let typeValeur = null;
    if(appareil.types_donnees) {
        typeValeur = appareil.types_donnees[senseurId]
    }

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
                    <FormatterValeurSenseur senseur={senseurLectureCourante}/>
                </Col>
            </Row>

            <p></p>

            <StatistiquesSenseur 
                appareil={appareil} 
                senseurId={senseurId} 
                typeValeur={typeValeur} />

        </div>
    )
}

export default SenseurDetail

function FormatterValeurSenseur(props) {
    const { senseur } = props

    const typeValeur = senseur.type
    const { valeur, valeur_str } = senseur

    if(typeValeur === 'switch') {
        if(valeur === 1.0) return <span>ON</span>
        if(valeur === 0.0) return <span>OFF</span>
        const valeurPct = Math.floor(valeur*100)
        return <span>{valeurPct}%</span>
    }

    if(valeur) {
        return (
            <FormatterValeur valeur={valeur} typeValeur={typeValeur} />
        )
    }

    if(valeur_str) {
        return <span>{valeur_str}</span>
    }

    return ''
}

function StatistiquesSenseur(props) {

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

    const afficherStatistiques = useMemo(()=>{
        const decimals = getUnite(typeValeur)[0]
        return decimals !== null
    }, [typeValeur])

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

    if(!appareil || !senseurId || !afficherStatistiques) return ''

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

function typeChart(typeValeur) {
    let TypeChart = null
    switch(typeValeur) {
        case 'temperature': TypeChart = ChartTemperatures; break
        case 'humidite': TypeChart = ChartHumidite; break
        case 'pression': TypeChart = ChartPression; break
        case 'pression_tendance': TypeChart = ChartPression; break
        default: 
            TypeChart = NoChart
    }
    return TypeChart
}

function NoChart(props) {
    return ''
}

function StatistiquesTable72h(props) {
    const {liste, typeValeur} = props

    let jour = ''

    const [_, unite] = getUnite(typeValeur)

    const TypeChart = useMemo(()=>typeChart(typeValeur), [typeValeur])

    if(!liste) return ''

    return (
        <div>
            <h3>Table statistiques 3 jours</h3>
            <Row>
                <Col><TypeChart className='chart' value={liste} unite='heures' /></Col>
            </Row>
            <Row className='table-header'>
                <Col xs={4} md={2} className='text-overflow-clip'>
                    Date
                </Col>
                <Col md={2} className='d-none d-md-block'>
                    Heure
                </Col>
                <Col xs={2} xl={1} className='text-overflow-clip val-numerique'>Moyenne</Col>
                <Col xs={2} xl={1} className='text-overflow-clip val-numerique'>Maximum</Col>
                <Col xs={2} xl={1} className='text-overflow-clip val-numerique'>Minimum</Col>
            </Row>
            <ListeHeures liste={liste} typeValeur={typeValeur} />
        </div>
    )

}

function StatistiquesTable31j(props) {
    const {liste, typeValeur} = props

    const TypeChart = useMemo(()=>typeChart(typeValeur), [typeValeur])

    if(!liste) return ''

    return (
        <div>
            <h3>Table statistiques 31 jours</h3>
            <Row>
                <Col><TypeChart className='chart' value={liste} unite='jours' /></Col>
            </Row>
            <Row className='table-header'>
                <Col xs={4} md={4} xl={3} className='text-overflow-clip'>Jour</Col>
                <Col xs={2} xl={1} className='text-overflow-clip val-numerique'>Moyenne</Col>
                <Col xs={2} xl={1} className='text-overflow-clip val-numerique'>Maximum</Col>
                <Col xs={2} xl={1} className='text-overflow-clip val-numerique'>Minimum</Col>
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

    const afficherMax = typeValeur!=='switch'
    const afficherMin = typeValeur!=='switch'

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
                    <Col xs={2} xl={1} className='valeur-numerique'><FormatterValeur valeur={item.avg} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} xl={1} className='valeur-numerique'>
                        {afficherMax?
                            <FormatterValeur valeur={item.max} typeValeur={typeValeur} hideType={true} />
                            :''
                        }
                    </Col>
                    <Col xs={2} xl={1} className='valeur-numerique'>
                        {afficherMin?
                            <FormatterValeur valeur={item.min} typeValeur={typeValeur} hideType={true} />
                            :''
                        }
                    </Col>
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

    const afficherMax = typeValeur!=='switch'
    const afficherMin = typeValeur!=='switch'

    return liste.map(item=>(
        <Row key={item.heure}>
            <Col xs={4} md={4} xl={3}><FormatterDate value={item.heure} format="YYYY/MM/DD" /></Col>
            <Col xs={2} xl={1} className='valeur-numerique'><FormatterValeur valeur={item.avg} typeValeur={typeValeur} hideType={true} /></Col>
            <Col xs={2} xl={1} className='valeur-numerique'>
                {afficherMax?
                    <FormatterValeur valeur={item.max} typeValeur={typeValeur} hideType={true} />
                    :''
                }
            </Col>
            <Col xs={2} xl={1} className='valeur-numerique'>
                {afficherMin?
                    <FormatterValeur valeur={item.min} typeValeur={typeValeur} hideType={true} />
                    :''
                }
            </Col>
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

    const TypeChart = useMemo(()=>typeChart(typeValeur), [typeValeur])

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
                        <Col><TypeChart className='chart' value={liste} unite={grouping} /></Col>
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
    if(valeur === undefined || valeur === '' || isNaN(valeur)) return ''

    if(typeValeur === 'switch') {
        if(valeur === 1.0) return <span>ON</span>
        if(valeur === 0.0) return <span>OFF</span>
        const valeurPct = Math.floor(valeur*100)
        return <span>{valeurPct}%</span>
    }

    let [decimals, unite] = getUnite(typeValeur)
    if(hideType) unite = ''

    if(valeur !== null && decimals !== null) {
        return <span>{valeur.toFixed(decimals)} {unite}</span>
    } else {
        return <span>{`${valeur + unite}`}</span>
    }
}

function getUnite(typeValeur) {
    let decimals = null, unite = ''
    switch(typeValeur) {
        case 'temperature': decimals = 1; unite = <span>&deg;C</span>; break
        case 'humidite': decimals = 1; unite = '%'; break
        case 'pression': decimals = 0; unite = 'hPa'; break
        case 'pression_tendance': decimals = 0; unite = 'Pa'; break
        default:
    }
    return [decimals, unite]
}

// const TIMEZONES = [
//     'America/Montreal',
//     'America/Toronto'
// ]

function TimezoneOptions(props) {
    return PYTZ_TIMEZONES.map(item=>{
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

