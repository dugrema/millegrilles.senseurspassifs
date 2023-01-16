import { useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';

import { FormatterDate } from '@dugrema/millegrilles.reactjs'


function AfficherSenseurs(props) {
    const { appareil, editMode, cacherSenseurs, setCacherSenseurs, setDescriptifSenseurs, ouvrirDetailSenseur } = props
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
                <Col xs={0} md={1}>
                    {editMode?
                        <Form.Check checked={selectionne} onChange={toggleCacherHandler} value={senseurId} />
                    :''}
                </Col>

                {editMode?
                    <>
                        <Col xs={7} md={4}>
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
                        <Col xs={7} md={4} className='bouton-link-nopadding'>
                            {ouvrirDetailSenseur?
                                <Button variant="link" 
                                    onClick={ouvrirDetailSenseur} 
                                    data-appareil={appareil.uuid_appareil} 
                                    value={item.senseurId}>
                                    {descriptif || item.senseurId}
                                </Button>
                                :
                                <span>{descriptif || item.senseurId}</span>
                            }
                        </Col>
                        <AfficherValeurFormattee senseur={item} />
                    </>
                }
            </Row>
        )
    })
}

export default AfficherSenseurs

function AfficherValeurFormattee(props) {
    const { senseur } = props
    const { timestamp, valeur, valeur_str, type} = senseur
  
    if(valeur_str) return <Col xs={5} md={7} className='valeur-texte'>{valeur_str}</Col>  // Aucun formattage
  
    if(type === 'temperature') {
      return (
        <>
          <Col xs={4} md={6} className="valeur-numerique">{valeur.toFixed(1)}</Col>
          <Col xs={1}>&deg;C</Col>
        </>
      )
    } else if(type === 'humidite') {
      return (
        <>
          <Col xs={4} md={6} className="valeur-numerique">{valeur.toFixed(1)}</Col>
          <Col xs={1}>%</Col>
        </>
        )
    } else if(type === 'pression') {
      return (
        <>
          <Col xs={4} md={6}className="valeur-numerique">{valeur.toFixed(1)}</Col>
          <Col xs={1}>kPa</Col>
        </>
      )
    }
  
    // Format non reconnu
    return valeur
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