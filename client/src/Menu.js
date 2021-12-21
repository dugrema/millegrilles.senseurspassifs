import { useCallback, useState } from 'react'

import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'

import { IconeConnexion } from '@dugrema/millegrilles.reactjs'

function Menu(props) {

    // console.debug("!!! Menu Proppys : %O", props)

    const { 
      setPage, paramsRecherche, setParamsRecherche,
      showTransfertModal,  
    } = props

    return (
      <Navbar collapseOnSelect expand="md">
        
        <Navbar.Brand>
          <Nav.Link onClick={()=>setPage('Accueil')} title="Accueil MilleGrilles Senseurs Passifs">
              Senseurs Passifs
          </Nav.Link>
        </Navbar.Brand>

        <Navbar.Collapse id="responsive-navbar-menu">

            <DropDownUsager {...props} />

        </Navbar.Collapse>

        <Nav><Nav.Item><IconeConnexion connecte={props.etatConnexion} /></Nav.Item></Nav>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

      </Navbar>
    )
}

export default Menu

function DropDownUsager(props) {

    const nomUsager = props.usager?props.usager.nomUsager:''
  
    let linkUsager = <><i className="fa fa-user-circle-o"/> {nomUsager}</>
    if(!nomUsager) linkUsager = 'Parametres'

    return (
        <NavDropdown title={linkUsager} id="basic-nav-dropdown" drop="down" className="menu-item">
          <NavDropdown.Item>
            <i className="fa fa-language" /> {' '} Changer Langue
          </NavDropdown.Item>
          <NavDropdown.Item href="/millegrilles">
            <i className="fa fa-home" /> {' '} Portail
          </NavDropdown.Item>
          <NavDropdown.Item href="/fermer">
            <i className="fa fa-close" /> {' '} Deconnecter
          </NavDropdown.Item>
        </NavDropdown>
    )

}

// import React from 'react'
// import { Nav, Navbar, NavLink, NavItem, Dropdown } from 'react-bootstrap';

// import { Trans } from 'react-i18next';

// export function Menu(props) {

//   let boutonProtege
//   if(props.rootProps.modeProtege) {
//     boutonProtege = <i className="fa fa-lg fa-lock protege"/>
//   } else {
//     boutonProtege = <i className="fa fa-lg fa-unlock"/>
//   }

//   return (
//     <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
//       <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
//       <Navbar.Toggle aria-controls="responsive-navbar-menu" />
//       <Navbar.Collapse id="responsive-navbar-menu">
//         <MenuItems changerPage={props.changerPage} rootProps={props.rootProps}/>
//         <Nav className="justify-content-end">
//           <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
//           <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
//         </Nav>
//       </Navbar.Collapse>
//     </Navbar>
//   )
// }

// export class MenuItems extends React.Component {

//   changerPage = event => {
//     this.props.changerPage(event)
//   }

//   render() {

//     return (
//       <Nav className="mr-auto" activeKey={this.props.section} onSelect={this.changerPage}>

//         <Nav.Item>
//           <Nav.Link eventKey='Accueil'>
//             <Trans>menu.Accueil</Trans>
//           </Nav.Link>
//         </Nav.Item>

//         <Dropdown as={NavItem}>
//           <Dropdown.Toggle as={NavLink}><Trans>menu.Favoris</Trans></Dropdown.Toggle>
//           <Dropdown.Menu>
//             <Dropdown.Item eventKey="GererFavoris"><Trans>menu.GererFavoris</Trans></Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>

//       </Nav>
//     )
//   }
// }
