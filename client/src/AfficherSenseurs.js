import { useCallback, useState, useMemo } from 'react'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';

import useWorkers from './WorkerContext'

function AfficherSenseurs(props) {
    const { appareil, editMode, cacherSenseurs, setCacherSenseurs, setDescriptifSenseurs, ouvrirDetailSenseur, afficherTous } = props
    const { senseurs, lectures_disponibles } = appareil
    const configuration = useMemo(()=>appareil.configuration || {}, [appareil])
    const cacherSenseursNonEdit = configuration.cacher_senseurs || []
    const descriptifSenseurs = useMemo(()=>{
        return props.descriptifSenseurs || configuration.descriptif_senseurs || {}
    }, [props, configuration])

    const liste = useMemo(()=>{
      if(!senseurs && !lectures_disponibles) return

    //   console.debug("Preparer liste senseurs pour appareil %O (senseurs : %O, lectures_disponibles: %O)", 
    //     appareil, senseurs, lectures_disponibles)

      const lecturesDisponibles = new Set(lectures_disponibles)
      const liste = []
      if(senseurs) {
        for (const senseurId of Object.keys(senseurs)) {
            const contenu = senseurs[senseurId]
            liste.push({...contenu, senseurId})
            lecturesDisponibles.delete(senseurId)
        }
      }
      for (const senseurId of lecturesDisponibles) {
        liste.push({senseurId})
      }
      liste.sort(sortSenseurs(appareil))
      // console.debug("Liste senseurs triee : %O", liste)
  
      return liste
    }, [appareil, senseurs, lectures_disponibles])

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

    if(!liste || liste.length === 0) return ''
  
    return liste.map(item=>{
        const senseurId = item.senseurId
        
        let selectionne = false
        if(cacherSenseurs) {
            selectionne = ! cacherSenseurs.includes(senseurId)
        } else {
            selectionne = ! cacherSenseursNonEdit.includes(senseurId)
        }

        if(!afficherTous && !editMode && !selectionne) return ''  // Cacher le senseur
        
        const descriptif = descriptifSenseurs[senseurId] || ''

        return (
            <RowSenseur 
                key={senseurId}
                appareil={appareil}
                item={item}
                selectionne={selectionne}
                editMode={editMode}
                descriptif={descriptif}
                ouvrirDetailSenseur={ouvrirDetailSenseur}
                toggleCacherHandler={toggleCacherHandler}
                majDescriptifSenseur={majDescriptifSenseur} />
        )
    })
}

export default AfficherSenseurs

function RowSenseur(props) {

    const { item, appareil, selectionne, editMode, descriptif, toggleCacherHandler, majDescriptifSenseur, ouvrirDetailSenseur } = props

    const senseurId = item.senseurId

    const [toggling, setToggling] = useState(false)  // Utilise comme debounce, changement d'etat pour une switch

    const startTogglingCb = useCallback(()=>{
        setToggling(true)
        setTimeout(()=>setToggling(false), 3_000)
    }, [setToggling])

    if(editMode) {
        return (
            <Row>
                <Col xs={1}>
                    {editMode?
                        <Form.Check id={'check_'+senseurId} checked={selectionne} onChange={toggleCacherHandler} value={senseurId} />
                    :''}
                </Col>
                <Col xs={11} sm={5} md={4}>
                    <Form.Label htmlFor={'check_'+senseurId}>{item.senseurId}</Form.Label>
                </Col>
                <Col xs={12} sm={6}>
                    <Form.Control 
                        type="text" 
                        placeholder="Changer nom" 
                        onChange={majDescriptifSenseur}
                        name={senseurId}
                        value={descriptif} />
                </Col>
            </Row>
        )
    }

    const className = selectionne?'senseur-ligne selectionne':'senseur-ligne cache'

    return (
        <Row className={className}>
            <Col xs={0} md={1}></Col>
            <Col xs={7} md={4} xl={2} className='bouton-link-nopadding'>
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
            <AfficherValeurFormattee 
                appareil={appareil} 
                senseur={item} 
                toggling={toggling} 
                startTogglingCb={startTogglingCb} />
        </Row>        
    )
}

function AfficherValeurFormattee(props) {
    // console.debug("AfficherValeurFormattee PROPPIES", props)
    const { appareil, toggling, startTogglingCb } = props
    const senseur = props.senseur || {}
    const { instance_id, uuid_appareil } = appareil
    const { senseurId, valeur, valeur_str, type} = senseur
  
    const workers = useWorkers()

    const toggleSwitchHandler = useCallback(()=>{
        const { connexion } = workers
        const toggleValeur = valeur?0:1
        const commande = { 
            instance_id, uuid_appareil, senseur_id: senseurId, 
            valeur: toggleValeur,
            commande_action: 'setSwitchValue'
        }
        console.debug("Emettre commande switch ", commande)
        startTogglingCb()
        connexion.commandeAppareil(instance_id, commande)
            .then(reponse=>{
                console.debug("Commande emise ", reponse)
            })
            .catch(err=>console.error("AfficherValeurFormattee.toggleSwitchHandler Erreur ", err))
    }, [workers, instance_id, uuid_appareil, senseurId, valeur, startTogglingCb])

    if(valeur_str) return <Col xs={5} md={7} className='valeur-texte'>{valeur_str}</Col>  // Aucun formattage
  
    const valeurNumerique = (!valeur || isNaN(valeur))?'':valeur

    let classSens = ''
    if(valeurNumerique) {
        if(valeurNumerique > 50) classSens += ' hausse'
        else if(valeurNumerique < -50) classSens += ' baisse'
    } 

    if(type === 'temperature') {
      return (
        <>
          <Col xs={4} md={3} xl={2} className="valeur-numerique">{formatteurValeurFixed(valeur, 1)}</Col>
          <Col xs={1}>&deg;C</Col>
        </>
      )
    } else if(type === 'humidite') {
      return (
        <>
          <Col xs={4} md={3} xl={2} className="valeur-numerique">{formatteurValeurFixed(valeur, 1)}</Col>
          <Col xs={1}>%</Col>
        </>
        )
    } else if(type === 'pression') {
      return (
        <>
          <Col xs={4} md={3} xl={2} className="valeur-numerique">{formatteurValeurFixed(valeur, 0)}</Col>
          <Col xs={1}>hPa</Col>
        </>
      )
    } else if(type === 'pression_tendance') {
        return (
          <>
            <Col xs={4} md={3} xl={2} className={'valeur-numerique tendance ' + classSens}>
                <i className="fa fa-level-up" />
                <i className="fa fa-level-down" />
                {valeurNumerique}
            </Col>
            <Col xs={1}>Pa</Col>
          </>
        )
    } else if(type === 'switch') {
        return (
          <>
            <Col xs={3} md={2} xl={2} className="valeur-numerique"></Col>
            <Col xs={2} md={2} xl={1}>
                <Form.Check id={'check'+senseurId} type='switch' checked={valeur===1} onChange={toggleSwitchHandler} disabled={toggling} />
            </Col>
          </>
        )
      }
  
    // Format non reconnu
    return valeur
}

function formatteurValeurFixed(valeur, digits) {
    if(isNaN(valeur)) return ''
    if(!digits || digits < 0) return valeur.toFixed(0)
    return valeur.toFixed(digits)
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