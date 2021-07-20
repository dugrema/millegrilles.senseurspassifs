// Authentification avec U2F
import React from 'react'
import axios from 'axios'

// ConnexionServeur sert a verifier que le serveur est accessible, set info de base en memoire
// Transfere le controle a <ApplicationCoupdoeil /> via props.setInfoServeur
export class VerificationInfoServeur extends React.Component {

  componentDidMount() {
    const infoUrl = '/senseurspassifs/info.json'
    axios.get(infoUrl)
    .then(response=>{
      // console.debug("Reponse %s: %O", infoUrl, response)

      if(response.status === 200) {
        const serveurInfo = response.data
        this.traiterServeurJson(serveurInfo)
      } else {
        // Erreur acces serveur
        this.props.setInfoServeur({
          serveurInfo: null,
          erreurAccesServeur: true,
        })
      }

    })
    .catch(err=>{
      console.error("Erreur access information du serveur")
      console.error(err)

      // Afficher message erreur a l'ecran
      this.props.setInfoServeur({
        serveurInfo: null,
        erreurAccesServeur: true,
      })

    })
  }

  traiterServeurJson(serveurInfo) {
    var hebergement = serveurInfo.modeHebergement

    const stateUpdate = {
      serveurInfo,
      erreurAccesServeur: false,
    }

    const idmgSauvegarde = localStorage.getItem('idmg')
    if(!idmgSauvegarde || !hebergement) {

      if(!hebergement) {
        // Hebergement inactif, override du idmg sauvegarde
        stateUpdate.idmg = serveurInfo.idmg
      } else {
        // Hebergement, on utilise le IDMG sauvegarde (si disponible)
        stateUpdate.idmg = idmgSauvegarde
      }

    } else {
      // idmg sauvegarde
      stateUpdate.idmg = idmgSauvegarde
    }

    // Mise a jour du idmg sauvegarde
    localStorage.setItem('idmg', stateUpdate.idmg)

    // Transfere information au top level pour activer coupdoeil
    this.props.setInfoServeur(stateUpdate)
  }

  render() {
    return (
      <p>Initialisation de la connexion au serveur en cours ...</p>
    )
  }
}
