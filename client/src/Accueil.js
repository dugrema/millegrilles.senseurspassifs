import React, {useState, useEffect, useCallback, useMemo} from 'react'
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux'
import { proxy } from 'comlink'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, {useEtatPret} from './WorkerContext'
import { push as pushAppareils, mergeAppareil } from './redux/appareilsSlice'

import Appareil, {AfficherSenseurs} from './Appareil'

const CONST_DATE_VIEILLE = 300,
      CONST_DATE_EXPIREE = 1800


function Accueil(props) {

  const workers = useWorkers()
  const etatPret = useEtatPret()
  const dispatch = useDispatch()

  const appareils = useSelector(state=>state.appareils.listeAppareils)

  // Navigation appareil
  const [uuidAppareil, setUuidAppareil] = useState('')
  const appareilSelectionne = useMemo(()=>{
    if(!uuidAppareil || !appareils) return null
    return appareils.filter(item=>item.uuid_appareil===uuidAppareil).pop()
  }, [appareils, uuidAppareil])
  const fermerAppareilHandler = useCallback(()=>setUuidAppareil(''), [setUuidAppareil])

  // Messages, maj liste appareils
  const messageAppareilHandler = useCallback(evenement=>{
    const { routingKey, message } = evenement
    console.debug("Message appareil : %O", message)
    const action = routingKey.split('.').pop()
    if(action === 'lectureConfirmee') {
      dispatch(mergeAppareil(message))
    }
  }, [dispatch])

  const messageAppareilHandlerProxy = useMemo(()=>{
    return proxy(messageAppareilHandler)
  }, [messageAppareilHandler])

  useEffect(()=>{
    if(!etatPret || !messageAppareilHandlerProxy) return
    // Charger appareils de l'usager
    workers.connexion.getAppareilsUsager()
      .then(reponse=>{
        console.debug("Reponse : ", reponse)
        dispatch(pushAppareils({liste: reponse.appareils, clear: true}))
      })
      .catch(err=>console.error("Erreur reception liste appareils : ", err))

    // Subscribe
    workers.connexion.ecouterEvenementsAppareilsUsager(messageAppareilHandlerProxy)
      .then(()=>console.debug("ecouterEvenementsAppareilsUsager OK"))
      .catch(err=>console.error("Erreur ecoute evenements appareils : ", err))
    return () => {
      console.debug('retirerEvenementsAppareilsUsager')
      // Cleanup subscription
      workers.connexion.retirerEvenementsAppareilsUsager()
        .catch(err=>console.error("Erreur retrait ecoute evenements appareils : ", err))
    }
  }, [workers, dispatch, etatPret, messageAppareilHandlerProxy])

  // Rendering

  // Sous-selections
  if(appareilSelectionne) return (  // Afficher l'appareil
    <Appareil appareil={appareilSelectionne} fermer={fermerAppareilHandler} />
  )

  // Page accueil
  return (
    <div>
      <p>Accueil</p>

      <h2>Appareils</h2>
      <ListeAppareils liste={appareils} setUuidAppareil={setUuidAppareil} />
    </div>
  )

}

export default Accueil

function ListeAppareils(props) {
  const { liste, setUuidAppareil } = props

  const setUuidAppareilHandler = useCallback(event=>{
    setUuidAppareil(event.currentTarget.value)
  }, [setUuidAppareil])

  if(!liste) return <p>Aucuns appareils</p>

  const dateCourante = new Date().getTime() / 1000,
        dateVieille = dateCourante - CONST_DATE_VIEILLE,
        dateExpiree = dateCourante - CONST_DATE_EXPIREE

  return liste.map(item=>{
    const { uuid_appareil, derniere_lecture } = item
    const configuration = item.configuration || {}
    const nomAppareil = configuration.descriptif || item.uuid_appareil

    let classNameDate = ''
    if(!derniere_lecture || derniere_lecture < dateExpiree) {
      classNameDate += ' expire'
    } else if(!derniere_lecture || derniere_lecture < dateVieille) {
      classNameDate += ' vieux'
    }

    return (
      <div key={uuid_appareil}>
      
        <Row>
          <Col xs={8} md={4}>
            <Button variant="link" onClick={setUuidAppareilHandler} value={uuid_appareil}>
              {nomAppareil}
            </Button>
          </Col>
          <Col xs={4} md={3} xl={2} className={classNameDate}>
            <FormatterDate value={derniere_lecture} />
          </Col>
        </Row>
      
        <AfficherSenseurs appareil={item} />
      
      </div>
    )
  })
}
