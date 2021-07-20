import React, {useState, useCallback} from 'react'
import { Row, Col, Button } from 'react-bootstrap'

export function Accueil(props) {

  const changerPage = props.rootProps.changerPage

  const selectionnerNoeud = useCallback(event => {
    const changerPage = props.rootProps.changerPage
    const {value} = event.currentTarget

    // Simuler event
    const pageInfo = {
      value: 'Noeud',
      dataset: {noeud_id: value}
    }
    // console.debug("Afficher noeud :\n%O", pageInfo)
    changerPage({currentTarget: pageInfo})
  }, [changerPage])

  return (
    <div>
      <h1>Senseurs Passifs</h1>
      <ListeNoeuds noeuds={props.noeuds} selectionnerNoeud={selectionnerNoeud} />
    </div>
  )

}

function ListeNoeuds(props) {

  if(!props.noeuds) return ''

  const listeNoeuds = props.noeuds.map(noeud=>{
    return <NoeudItem key={noeud.noeud_id} noeud={noeud} selectionnerNoeud={props.selectionnerNoeud} />
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
        <Button onClick={props.selectionnerNoeud} value={noeud.noeud_id} variant="link">
          {noeud.descriptif?noeud.descriptif:noeud.noeud_id}
        </Button>
      </Col>
    </Row>
  )
}
