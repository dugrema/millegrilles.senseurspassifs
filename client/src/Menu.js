import React from 'react'
import { Nav, Navbar, NavLink, NavItem, Dropdown } from 'react-bootstrap';

import { Trans } from 'react-i18next';

export function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems changerPage={props.changerPage} rootProps={props.rootProps}/>
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export class MenuItems extends React.Component {

  changerPage = event => {
    this.props.changerPage(event)
  }

  render() {

    return (
      <Nav className="mr-auto" activeKey={this.props.section} onSelect={this.changerPage}>

        <Nav.Item>
          <Nav.Link eventKey='Accueil'>
            <Trans>menu.Accueil</Trans>
          </Nav.Link>
        </Nav.Item>

        <Dropdown as={NavItem}>
          <Dropdown.Toggle as={NavLink}><Trans>menu.Favoris</Trans></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="GererFavoris"><Trans>menu.GererFavoris</Trans></Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

      </Nav>
    )
  }
}

// function DropdownDomaines(props) {
//   const domaines = props.domaines
//
//   const items = domaines.map((domaine, idx)=>{
//     return <DropdownDomaine key={idx} domaine={domaine} />
//   })
//
//   return (
//     <Dropdown as={NavItem}>
//       <Dropdown.Toggle as={NavLink}><Trans>menu.Domaines</Trans></Dropdown.Toggle>
//       <Dropdown.Menu>
//         {items}
//       </Dropdown.Menu>
//     </Dropdown>
//   )
//
// }

// function DropdownDomaine(props) {
//   const domaine = props.domaine
//   const nomDomaine = domaine.descriptif
//   const eventKey = "SommaireDomaine/domaine:" + nomDomaine
//   return (
//     <Dropdown.Item eventKey={eventKey}><Trans>{'menu.' + nomDomaine}</Trans></Dropdown.Item>
//   )
// }

// function DropdownNoeuds(props) {
//   const noeuds = props.noeuds
//
//   const items = noeuds.map((noeud, idx)=>{
//     return <DropdownNoeud key={idx} noeud={noeud} />
//   })
//
//   return (
//     <Dropdown as={NavItem}>
//       <Dropdown.Toggle as={NavLink}><Trans>menu.Noeuds</Trans></Dropdown.Toggle>
//       <Dropdown.Menu>
//         <Dropdown.Item eventKey="ConfigurationNoeuds"><Trans>menu.AjouterNoeud</Trans></Dropdown.Item>
//         {items}
//       </Dropdown.Menu>
//     </Dropdown>
//   )
//
// }

// function DropdownNoeud(props) {
//   const noeud = props.noeud
//   const nomNoeud = noeud.descriptif
//   const eventKey = "SommaireNoeud/noeudid:" + noeud.noeud_id
//   return (
//     <Dropdown.Item eventKey={eventKey}>{nomNoeud}</Dropdown.Item>
//   )
// }
