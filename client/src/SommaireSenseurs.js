import React, {useState, useEffect, useMemo} from 'react'
import { Row, Col } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import {DateTimeAfficher} from './components/ReactFormatters'

// const _contexteCallback = {}

const CONST_CHAMPS_SOMMAIRE = [
  // {suffix: 'epoch', format: val=>{new Date(val*1000)}},
  {suffix: 'temperature', formatter: val=><span>{val.toFixed(1)}&deg;C</span>},
  {suffix: 'humidite', formatter: val=><span>{val.toFixed(1)}%</span>},
  {suffix: 'pression', formatter: val=><span>{val.toFixed(1)} kPa</span>},
]

export default function Sommaire(props) {

  // console.debug("Sommaire proppys : %O", props)
  const { workers, etatAuthentifie, listeNoeuds } = props

  const [senseurs, setSenseurs] = useState('')
  const [messageSenseur, addMessageSenseur] = useState('')

  const connexion = workers.connexion,
        noeuds = listeNoeuds.noeuds,
        partition = listeNoeuds.partition

  const messageRecuCb = useMemo(()=>comlinkProxy(addMessageSenseur), [addMessageSenseur])

  // Entretien contexte callback comlink proxy
  useEffect(()=>{
    if(messageSenseur) {
      console.debug("Message senseur : %O", messageSenseur)
      traiterLecture(messageSenseur, senseurs, setSenseurs)      
      addMessageSenseur('') // Clear queue
    }
  }, [messageSenseur, senseurs, setSenseurs])

  useEffect(()=>{
    // console.debug("!!! connexion : %O, etatAuthentifie: %O, noeuds: %O", connexion, etatAuthentifie, noeuds)
    if(connexion && etatAuthentifie && noeuds) {
      // console.debug("Chargement senseurs pour noeuds : %O", noeuds)
      Promise.all(noeuds.map(item=>connexion.getListeSenseursNoeud(item.instance_id, {partition})))
        .then(resultat=>{
          // console.debug("Senseurs charges noeud : %O", resultat)
          // setSenseurs(senseurs)
          let senseurs = []
          resultat.forEach(res=>{
            senseurs = [...senseurs, ...res.senseurs]
          })
          setSenseurs(senseurs)
        })
        .catch(err=>console.error("Erreur chargement senseurs : %O", err))
    }
  }, [connexion, etatAuthentifie, noeuds, messageRecuCb])

  useEffect(()=>{
    if(connexion && etatAuthentifie && messageRecuCb) {
      connexion.ecouterEvenementsSenseurs(messageRecuCb)
      return ()=>{
        connexion.retirerEvenementsSenseurs(messageRecuCb)
      }
    }
  }, [connexion, etatAuthentifie, messageRecuCb])

  if(!props.listeNoeuds) return ''

  const noeudsTries = [...props.listeNoeuds.noeuds]
  noeudsTries.sort((a,b)=>{
    const nomA = a.descriptif || a.instance_id,
          nomB = b.descriptif || b.instance_id

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

    const instance_id = noeud.instance_id,
          listeSenseurs = Object.values(props.senseurs),
          senseurs = listeSenseurs.filter(item=>item.instance_id===instance_id),
          nom = noeud.descriptif || noeud.instance_id

    // console.debug("Senseurs : %O (Proppys %O)", senseurs, props)

    return (
      <div key={noeud.instance_id}>
        <Row>
          <Col>{nom}</Col>
        </Row>

        <ListeSenseurs noeud={noeud}
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
