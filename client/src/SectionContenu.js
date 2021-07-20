import React from 'react'

import { Accueil } from './Accueil'
import { Noeud } from './Noeud'

const domainesConnus = {
  Accueil,
  Noeud,
}

export function SectionContenu(props) {

  const Page = domainesConnus[props.page]

  let contenu
  if(Page) {
    contenu = <Page {...props} />
  } else {
    contenu = <p>Section non definie : "{props.page}"</p>
  }

  return contenu
}
