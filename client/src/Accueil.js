import React, {useState, useCallback} from 'react'
import { Row, Col, Button } from 'react-bootstrap'

import Sommaire from './SommaireSenseurs'

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
      <ListeNoeuds listeNoeuds={props.listeNoeuds} selectionnerNoeud={selectionnerNoeud} />

      <h2>Sommaire</h2>
      <Sommaire noeuds={props.noeuds}
                workers={props.workers}
                rootProps={props.rootProps} />
    </div>
  )

}

function ListeNoeuds(props) {

  if(!props.listeNoeuds) return ''

  const listeNoeuds = props.listeNoeuds.noeuds.map(noeud=>{
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
