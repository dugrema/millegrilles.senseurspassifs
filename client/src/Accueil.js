import React, {useCallback} from 'react'
import { Row, Col, Button } from 'react-bootstrap'

import Sommaire from './SommaireSenseurs'

export function Accueil(props) {

  const { workers, etatAuthentifie, listeNoeuds} = props
  const rootProps = props.rootProps || {}
  const { changerPage } = rootProps

  const selectionnerNoeud = useCallback(event => {
    const {value} = event.currentTarget

    // Simuler event
    const pageInfo = {
      value: 'Noeud',
      dataset: {instance_id: value}
    }
    
    // console.debug("Afficher noeud :\n%O", pageInfo)
    changerPage({currentTarget: pageInfo})
  }, [changerPage])

  return (
    <div>
      <h1>Senseurs Passifs</h1>
      <ListeNoeuds listeNoeuds={listeNoeuds} selectionnerNoeud={selectionnerNoeud} />

      <h2>Sommaire</h2>
      <Sommaire listeNoeuds={listeNoeuds}
                workers={workers}
                rootProps={rootProps} 
                etatAuthentifie={etatAuthentifie} />
    </div>
  )

}

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
