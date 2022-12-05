import React, {useEffect, useCallback, useMemo} from 'react'
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux'
import { proxy } from 'comlink'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import useWorkers, {useEtatPret} from './WorkerContext'
import { push as pushAppareils } from './redux/appareilsSlice'

function Accueil(props) {

  const workers = useWorkers()
  const etatPret = useEtatPret()
  const dispatch = useDispatch()

  const appareils = useSelector(state=>state.appareils.listeAppareils)

  const messageAppareilHandler = useCallback(message=>{
    console.debug("Message appareil : %O", message)
  }, [])

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

  return (
    <div>
      <p>Accueil</p>

      <h2>Appareils</h2>
      <ListeAppareils liste={appareils} />
    </div>
  )

}

export default Accueil

function ListeAppareils(props) {
  const { liste } = props

  if(!liste) return <p>Aucuns appareils</p>

  return liste.map(item=>{
    return (
      <Row key={item.uuid_appareil}>
        <Col>{item.descriptif || item.uuid_appareil}</Col>
      </Row>
    )
  })
}