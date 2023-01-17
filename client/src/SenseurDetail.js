import { useState, useEffect } from 'react'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers from './WorkerContext'

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
                typeValeur={senseurLectureCourante.type} />

        </div>
    )
}

export default SenseurDetail

function StatisquesSenseur(props) {

    const { appareil, senseurId, typeValeur } = props
    const uuid_appareil = appareil.uuid_appareil

    const workers = useWorkers()
    
    const [stats, setStats] = useState('')

    useEffect(()=>{
        if(!uuid_appareil || !senseurId) return
        console.debug("Charger statistiques senseur %s appareil %s", senseurId, uuid_appareil)
        const requete = {senseur_id: senseurId, uuid_appareil}
        workers.connexion.getStatistiquesSenseur(requete)
            .then(reponse=>{
                console.debug("Reponse statistiques ", reponse)
                setStats(reponse)
            })
            .catch(err=>console.error("Erreur chargement statistiques ", err))
    }, [workers, uuid_appareil, senseurId, setStats])

    if(!appareil || !senseurId) return ''

    return (
        <div>
            <h3>Statistiques</h3>

            <StatistiquesTable72h liste={stats.periode72h} typeValeur={typeValeur} />
            <StatistiquesTable31j liste={stats.periode31j} typeValeur={typeValeur} />
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
                <Col xs={4} md={4} xl={3} className='text-overflow-clip'>Heure</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Moyenne</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Maximum</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Minimum</Col>
            </Row>
            {liste.map(item=>{
                let jourItem = new Date(item.heure * 1000).getDay()
                if(jourItem === jour) {
                    jourItem = null
                } else {
                    jour = jourItem
                }

                return (
                    <div key={item.heure}>
                        {jourItem?
                            <Row><FormatterDate format='YYYY/MM/DD' value={item.heure} /></Row>
                        :''}
                        <Row>
                            <Col xs={4} md={4} xl={3}><FormatterDate format='HH:mm:ss' value={item.heure} /></Col>
                            <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.avg} typeValeur={typeValeur} hideType={true} /></Col>
                            <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.max} typeValeur={typeValeur} hideType={true} /></Col>
                            <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.min} typeValeur={typeValeur} hideType={true} /></Col>
                            <Col xs={2} lg={1}>{unite}</Col>
                        </Row>
                    </div>
                )
            })}
        </div>
    )

}

function StatistiquesTable31j(props) {
    const {liste, typeValeur} = props

    if(!liste) return ''

    const [_, unite] = getUnite(typeValeur)

    return (
        <div>
            <h3>Table statistiques 31 jours</h3>
            <Row>
                <Col xs={4} md={4} xl={3} className='text-overflow-clip'>Jour</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Moyenne</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Maximum</Col>
                <Col xs={2} lg={1} className='text-overflow-clip'>Minimum</Col>
            </Row>
            {liste.map(item=>(
                <Row key={item.heure}>
                    <Col xs={4} md={4} xl={3}><FormatterDate value={item.heure} format="YYYY/MM/DD" /></Col>
                    <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.avg} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.max} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} lg={1} className='valeur-numerique'><FormatterValeur valeur={item.min} typeValeur={typeValeur} hideType={true} /></Col>
                    <Col xs={2} lg={1}>{unite}</Col>
                </Row>
            ))}
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
        case 'pression': decimals = 1; unite = 'kPa'; break
        default:
    }
    return [decimals, unite]
}