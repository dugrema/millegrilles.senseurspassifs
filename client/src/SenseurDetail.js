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
        </div>
    )
}

function StatistiquesTable72h(props) {
    const {liste, typeValeur} = props

    if(!liste) return ''

    return (
        <div>
            <h3>Table statistiques 3 jours</h3>
            <Row>
                <Col xs={6} md={4} xl={3}>Heure</Col>
                <Col xs={2} lg={1}>Moyenne</Col>
                <Col xs={2} lg={1}>Maximum</Col>
                <Col xs={2} lg={1}>Minimum</Col>
            </Row>
            {liste.map(item=>(
                <Row key={item.heure}>
                    <Col xs={6} md={4} xl={3}><FormatterDate value={item.heure} /></Col>
                    <Col xs={2} lg={1}><FormatterValeur valeur={item.avg} typeValeur={typeValeur} /></Col>
                    <Col xs={2} lg={1}><FormatterValeur valeur={item.max} typeValeur={typeValeur} /></Col>
                    <Col xs={2} lg={1}><FormatterValeur valeur={item.min} typeValeur={typeValeur} /></Col>
                </Row>
            ))}
        </div>
    )

}

function FormatterValeur(props) {
    const {valeur, typeValeur} = props
    if(isNaN(valeur)) return ''

    switch(typeValeur) {
        case 'temperature': return valeur.toFixed(1) + ' C'
        case 'humidite': return valeur.toFixed(1) + ' %'
        case 'pression': return valeur.toFixed(1) + ' kPa'
        default:
            return ''+valeur
    }
}
