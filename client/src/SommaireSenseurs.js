import React, {useState, useEffect, useCallback} from 'react'
import { Row, Col } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import {DateTimeAfficher} from './components/ReactFormatters'

const _contexteCallback = {}

export default function Sommaire(props) {

  const [senseurs, setSenseurs] = useState('')

  const connexion = props.workers.connexion,
        modeProtege = props.rootProps.modeProtege,
        noeuds = props.noeuds

  const messageRecu = useCallback(comlinkProxy(message => {
    console.debug("Message : %O", message)
    traiterLecture(message, _contexteCallback.senseurs, _contexteCallback.setSenseurs)
  }), [])

  // Entretien contexte callback comlink proxy
  useEffect(()=>{
    _contexteCallback.senseurs = senseurs
    _contexteCallback.setSenseurs = setSenseurs
  }, [senseurs, setSenseurs])

  useEffect(()=>{
    if(!senseurs && connexion && modeProtege && noeuds) {
      Promise.all(noeuds.map(item=>connexion.getListeSenseursNoeud(item.noeud_id)))
        .then(resultat=>{
          console.debug("Senseurs charges : %O", resultat)
          // setSenseurs(senseurs)
          let senseurs = []
          resultat.forEach(res=>{
            senseurs = [...senseurs, ...res]
          })
          setSenseurs(senseurs)
        })
    }

    if(connexion && messageRecu) {
      connexion.ecouterEvenementsSenseurs(messageRecu)
      return ()=>{
        connexion.retirerEvenementsSenseurs()
      }
    }
  }, [connexion, modeProtege, noeuds, senseurs, messageRecu])

  if(!props.noeuds) return ''

  return (
    <>
      <ListeNoeuds noeuds={props.noeuds}
                   senseurs={senseurs} />
    </>
  )
}

function ListeNoeuds(props) {

  if(!props.senseurs) return ''

  return props.noeuds.map(noeud=>{

    const noeud_id = noeud.noeud_id,
          listeSenseurs = Object.values(props.senseurs),
          senseurs = listeSenseurs.filter(item=>item.noeud_id===noeud_id),
          nom = noeud.descriptif || noeud.noeud_id

    console.debug("Senseurs : %O (Proppys %O)", senseurs, props)

    return (
      <div key={noeud.noeud_id}>
        <Row>
          <Col>{nom}</Col>
        </Row>

        <ListeSenseurs {...props}
                       noeud={noeud}
                       senseurs={senseurs} />
      </div>
    )
  })

}

function ListeSenseurs(props) {

  const senseurs = props.senseurs

  if(!senseurs) return ''

  const champs = [
    // {suffix: 'epoch', format: val=>{new Date(val*1000)}},
    {suffix: 'temperature', formatter: val=><span>{Math.round(val, 1)}&deg;C</span>},
    {suffix: 'humidite', formatter: val=><span>{Math.round(val, 1)}%</span>},
    {suffix: 'pression', formatter: val=><span>{Math.round(val, 1)} kPa</span>},
  ]

  const cols = champs.map((champ, idx)=>{
    let valeur = ''

    senseurs.forEach(item=>{
      for(let nomApp in item.senseurs) {
        if(nomApp.endsWith(champ.suffix)) {
          const valeurs = item.senseurs[nomApp]
          valeur = valeurs.valeur
          if(champ.formatter) valeur = champ.formatter(valeur)
        }
      }
    })

    return <Col xs={12} sm={3} md={1} key={idx}>{valeur}</Col>
  })

  return senseurs.map(item=>{
    const nom = item.descriptif || item.uuid_senseur,
          dateLecture = item['_mg-derniere-modification']
    return (
      <Row key={item.uuid_senseur}>
        <Col md={2}>{nom}</Col>
        <Col md={2}><DateTimeAfficher date={dateLecture} /></Col>
        {cols}
      </Row>
    )
  })

}

function traiterLecture(evenement, senseurs, setSenseurs) {
  const message = evenement.message,
        uuid_senseur = message.uuid_senseur

  // console.debug("Lecture recue :\n%O\nSenseurs: %O", message, senseurs)

  if(!senseurs) return

  var trouve = false
  const copieSenseurs = senseurs.map(senseurExistant=>{
    if(senseurExistant.uuid_senseur === uuid_senseur) {
      trouve = true
      // Remplacer le senseur
      const copieSenseur = Object.assign({}, senseurExistant)
      // copieSenseur.senseurs = message.senseurs

      // Remplacer chaque lecture de senseur
      // Conserver les donnees non-inclues dans la transaction (e.g. vpin blynk)
      for(let nomApp in message.senseurs) {
        var lectureExistante = copieSenseur.senseurs[nomApp]
        var copieApp = {nouveau: true}  // Par defaut, nouveau
        if(lectureExistante) {
          copieApp = Object.assign({}, lectureExistante)
        }
        // Remplacer donnees maj dans la lecture copiee
        copieApp = Object.assign(copieApp, message.senseurs[nomApp])
        copieSenseur.senseurs[nomApp] = copieApp
      }

      copieSenseur['_mg-derniere-modification'] = message['en-tete'].estampille

      // console.debug("Copie du senseur maj :\n%O", copieSenseur)

      return copieSenseur
    }
    return senseurExistant
  })

  if(!trouve) {
    // Ajouter le senseur a la liste
    // if(!message.securite) message.securite = exchange
    message.nouveau = true
    copieSenseurs.push(message)
  }

  // console.debug("Nouvelle liste senseurs :\n%O", copieSenseurs)

  setSenseurs(copieSenseurs)
}
