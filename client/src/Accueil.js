import React, {useCallback} from 'react'
import { Row, Col, Button } from 'react-bootstrap'

import Sommaire from './SommaireSenseurs'

function Accueil(props) {

  const { workers, listeNoeuds, setNoeudId, etatAuthentifie } = props
  const rootProps = props.rootProps || {}

  const handlerSelectionnerNoeud = useCallback(event => {
    const {value} = event.currentTarget
    setNoeudId(value)
  }, [setNoeudId])

  return (
    <div>
      <h1>Senseurs Passifs</h1>
      <ListeNoeuds listeNoeuds={listeNoeuds} selectionnerNoeud={handlerSelectionnerNoeud} />

      <h2>Sommaire</h2>
      <Sommaire listeNoeuds={listeNoeuds}
                workers={workers}
                rootProps={rootProps} 
                etatAuthentifie={etatAuthentifie} />
    </div>
  )

}

export default Accueil

function ListeNoeuds(props) {

  if(!props.listeNoeuds) return ''

  const listeNoeuds = props.listeNoeuds.noeuds.map(noeud=>{
    return <NoeudItem key={noeud.instance_id} noeud={noeud} partition={noeud.partition} selectionnerNoeud={props.selectionnerNoeud} />
  })

  return (
    <div>
      <h2>Noeuds</h2>
      {listeNoeuds}
    </div>
  )
}

function NoeudItem(props) {
  const noeud = props.noeud
  return (
    <Row>
      <Col>
        <Button onClick={props.selectionnerNoeud} value={noeud.instance_id} variant="link">
          {noeud.descriptif?noeud.descriptif:noeud.instance_id}
        </Button>
      </Col>
    </Row>
  )
}
