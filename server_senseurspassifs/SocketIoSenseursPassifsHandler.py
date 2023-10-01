import asyncio
import json
import logging

from typing import Optional, Union

from millegrilles_messages.messages import Constantes
from millegrilles_messages.messages.MessagesModule import MessageWrapper
from millegrilles_web import Constantes as ConstantesWeb
from millegrilles_web.SocketIoHandler import SocketIoHandler

from server_senseurspassifs import Constantes as ConstantesSenseursPassifs


class SocketIoSenseursPassifsHandler(SocketIoHandler):

    def __init__(self, app, stop_event: asyncio.Event):
        self.__logger = logging.getLogger(__name__ + '.' + self.__class__.__name__)
        super().__init__(app, stop_event)

    async def _preparer_socketio_events(self):
        await super()._preparer_socketio_events()

        self._sio.on('getAppareilsUsager', handler=self.requete_appareils_usager)
        self._sio.on('getAppareilsEnAttente', handler=self.requete_appareils_en_attente)
        self._sio.on('getStatistiquesSenseur', handler=self.requete_statistiques_senseur)
        self._sio.on('challengeAppareil', handler=self.challenge_appareil)
        self._sio.on('signerAppareil', handler=self.signer_appareil)
        self._sio.on('majAppareil', handler=self.maj_appareil)
        self._sio.on('commandeAppareil', handler=self.commande_appareil)
        self._sio.on('supprimerAppareil', handler=self.supprimer_appareil)
        self._sio.on('restaurerAppareil', handler=self.restaurer_appareil)

        # self._sio.on('ecouterEvenementsAppareilsUsager', handler=self.ecouter_appareils_usager)
        # self._sio.on('retirerEvenementsAppareilsUsager', handler=self.retirer_appareils_usager)

    @property
    def exchange_default(self):
        return ConstantesSenseursPassifs.EXCHANGE_DEFAUT

    async def requete_appareils_usager(self, sid: str, message: dict):
        return await self.executer_requete(sid, message,
                                           ConstantesSenseursPassifs.NOM_DOMAINE, 'getAppareilsUsager')

    async def challenge_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'challengeAppareil')

    async def challenge_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'challengeAppareil')

    async def signer_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'signerAppareil')

    async def requete_appareils_en_attente(self, sid: str, message: dict):
        return await self.executer_requete(sid, message,
                                           ConstantesSenseursPassifs.NOM_DOMAINE, 'getAppareilsEnAttente')

    async def requete_statistiques_senseur(self, sid: str, message: dict):
        return await self.executer_requete(sid, message,
                                           ConstantesSenseursPassifs.NOM_DOMAINE, 'getStatistiquesSenseur')

    async def maj_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'majAppareil')

    async def commande_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'commandeAppareil')

    async def supprimer_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'supprimerAppareil')

    async def restaurer_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'restaurerAppareil')

    # Listeners

    # async def ecouter_activation_fingerprint(self, sid: str, message: dict):
    #     "ecouterEvenementsActivationFingerprint"
    #     exchanges = [Constantes.SECURITE_PRIVE]
    #     fingerprint_pk = message['fingerprintPk']
    #     routing_keys = [f'evenement.CoreMaitreDesComptes.{fingerprint_pk}.activationFingerprintPk']
    #     # Note : message non authentifie (sans signature). Flag enveloppe=False empeche validation.
    #     reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=False)
    #     reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
    #     return reponse_signee
    #
    # async def retirer_activation_fingerprint(self, sid: str, message: dict):
    #     "retirerEvenementsActivationFingerprint"
    #     # Note : message non authentifie (sans signature)
    #     exchanges = [Constantes.SECURITE_PRIVE]
    #     fingerprint_pk = message['fingerprintPk']
    #     routing_keys = [f'evenement.CoreMaitreDesComptes.{fingerprint_pk}.activationFingerprintPk']
    #     reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
    #     reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)
    #     return reponse_signee
