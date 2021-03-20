import React from 'react'

import { Accueil } from './Accueil'
import { Noeud } from './Noeud'

const domainesConnus = {
  Accueil,
  Noeud,
}

export function SectionContenu(props) {

  const Page = domainesConnus[props.rootProps.page]

  let contenu
  if(Page) {
    contenu = <Page rootProps={props.rootProps} />
  } else {
    contenu = <p>Section non definie : "{props.rootProps.page}"</p>
  }

  return contenu
}
