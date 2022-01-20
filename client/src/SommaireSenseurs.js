import React, {useState, useEffect, useCallback} from 'react'
import { Row, Col } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import {DateTimeAfficher} from './components/ReactFormatters'

const _contexteCallback = {}

const CONST_CHAMPS_SOMMAIRE = [
  // {suffix: 'epoch', format: val=>{new Date(val*1000)}},
  {suffix: 'temperature', formatter: val=><span>{val.toFixed(1)}&deg;C</span>},
  {suffix: 'humidite', formatter: val=><span>{val.toFixed(1)}%</span>},
  {suffix: 'pression', formatter: val=><span>{val.toFixed(1)} kPa</span>},
]

export default function Sommaire(props) {

  // console.debug("Sommaire proppys : %O", props)

  const [senseurs, setSenseurs] = useState('')

  const connexion = props.workers.connexion,
        modeProtege = props.rootProps.modeProtege,
        noeuds = props.listeNoeuds.noeuds,
        partition = props.listeNoeuds.partition

  const messageRecu = useCallback(comlinkProxy(message => {
    // console.debug("Message : %O", message)
    traiterLecture(message, _contexteCallback.senseurs, _contexteCallback.setSenseurs)
  }), [])

  // Entretien contexte callback comlink proxy
  useEffect(()=>{
    _contexteCallback.senseurs = senseurs
    _contexteCallback.setSenseurs = setSenseurs
  }, [senseurs, setSenseurs])

  useEffect(()=>{
    if(!senseurs && connexion && modeProtege && noeuds) {
      Promise.all(noeuds.map(item=>connexion.getListeSenseursNoeud(item.noeud_id, {partition})))
        .then(resultat=>{
          console.debug("Senseurs charges noeud : %O", resultat)
          // setSenseurs(senseurs)
          let senseurs = []
          resultat.forEach(res=>{
            senseurs = [...senseurs, ...res.senseurs]
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

  if(!props.listeNoeuds) return ''

  const noeudsTries = [...props.listeNoeuds.noeuds]
  noeudsTries.sort((a,b)=>{
    const nomA = a.descriptif || a.noeud_id,
          nomB = b.descriptif || b.noeud_id

    return nomA.localeCompare(nomB)
  })

  return (
    <>
      <ListeNoeuds noeuds={noeudsTries}
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

    // console.debug("Senseurs : %O (Proppys %O)", senseurs, props)

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

  senseurs.sort((a,b)=>{
    const nomA = a.descriptif || a.uuid_senseur,
          nomB = b.descriptif || b.uuid_senseur

    return nomA.localeCompare(nomB)
  })

  return senseurs.map(item=>{
    const nom = item.descriptif || item.uuid_senseur,
          dateLecture = item.derniere_lecture

    const cols = CONST_CHAMPS_SOMMAIRE.map((champ, idx)=>{
      let valeur = ''

      for(let nomApp in item.senseurs) {
        if(nomApp.endsWith(champ.suffix)) {
          const valeurs = item.senseurs[nomApp]
          valeur = valeurs.valeur
          try {
            if(champ.formatter) valeur = champ.formatter(valeur)
          } catch(err) {
            console.warn("Traitement formattage nomApp %s %O", nomApp, err)
          }
        }
      }

      return <Col xs={4} sm={3} md={1} key={idx} className="senseur-valeur">{valeur}</Col>
    })

    return (
      <Row key={item.uuid_senseur}>
        <Col xs={6} sm={3} className="senseur-nom">{nom}</Col>
        <Col xs={6} sm={3} className="senseur-date"><DateTimeAfficher date={dateLecture} /></Col>
        {cols}
      </Row>
    )
  })

}

function traiterLecture(evenement, senseurs, setSenseurs) {
  const message = evenement.message,
        uuid_senseur = message.uuid_senseur

  console.debug("Lecture recue :\n%O\nSenseurs: %O", message, senseurs)

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

      // copieSenseur['_mg-derniere-modification'] = message['en-tete'].estampille
      copieSenseur.derniere_lecture = message.derniere_lecture

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
