import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';

export class Accueil extends React.Component {

  selectionnerNoeud = event => {
    const changerPage = this.props.rootProps.changerPage
    const {value} = event.currentTarget

    // Simuler event
    const pageInfo = {
      value: 'Noeud',
      dataset: {noeud_id: value}
    }
    // console.debug("Afficher noeud :\n%O", pageInfo)
    changerPage({currentTarget: pageInfo})
  }

  render() {

    return (
      <div>
        <h1>Senseurs Passifs</h1>
        <ListeNoeuds noeuds={this.props.rootProps.noeuds} selectionnerNoeud={this.selectionnerNoeud} />
      </div>
    )

  }

}

class ListeNoeuds extends React.Component {

  render() {

    const listeNoeuds = this.props.noeuds.map(noeud=>{
      return <NoeudItem key={noeud.noeud_id} noeud={noeud} selectionnerNoeud={this.props.selectionnerNoeud} />
    })

    return (
      <div>
        <h2>Noeuds</h2>
        {listeNoeuds}
      </div>
    )
  }

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
