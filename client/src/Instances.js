import React, {useState, useCallback, useMemo, useEffect} from 'react'
import { Row, Col, Button } from 'react-bootstrap'

const Instance = React.lazy( () => import('./Instance') )

function Instances(props) {

  const { listeInstances } = props

  const [instanceId, setInstanceId] = useState('')
  const handlerFermer = () => setInstanceId('')

  const selectionnerInstanceHandler = useCallback(event => {
    const {value} = event.currentTarget
    setInstanceId(value)
  }, [setInstanceId])

  const instance = useMemo(()=>{
    if(!listeInstances || !instanceId) return null
    console.debug("Liste instances : %O", listeInstances)
    return listeInstances.filter(item=>item.instance_id === instanceId).pop()
  }, [listeInstances, instanceId])

  // // Entretien du contexte global pour les callbacks comlink proxy
  // useEffect(()=>{
  //   if(messageNoeud) {
  //     majNoeud(messageNoeud, listeInstances, setListeInstances)
  //     addMessageNoeud('')  // Clear queue
  //   }
  // }, [messageNoeud, listeInstances, setListeInstances, addMessageNoeud])

  if(instanceId) {
    return (
      <Instance
        instance={instance}
        fermer={handlerFermer} />
    )
  }

  return (
    <div>
      <h2>Instances</h2>
      <ListeNoeuds listeInstances={listeInstances} selectionnerNoeud={selectionnerInstanceHandler} />
    </div>
  )

}

export default Instances

function ListeNoeuds(props) {

  const { listeInstances } = props

  if(!listeInstances) return ''

  return (
    <div>
      <h2>Noeuds</h2>

      {listeInstances.map(instance=>{
        return (
          <InstanceItem 
            key={instance.instance_id} 
            instance={instance} 
            partition={instance.instance_id} 
            selectionnerNoeud={props.selectionnerNoeud} />
        )
      })}

    </div>
  )
}

function InstanceItem(props) {
  const { instance } = props
  return (
    <Row>
      <Col>
        <Button onClick={props.selectionnerNoeud} value={instance.instance_id} variant="link">
          {instance.descriptif?instance.descriptif:instance.instance_id}
        </Button>
      </Col>
    </Row>
  )
}
