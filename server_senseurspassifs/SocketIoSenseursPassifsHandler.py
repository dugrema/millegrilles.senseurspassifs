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

        # self._sio.on('getRecoveryCsr', handler=self.get_recovery_csr)

    @property
    def exchange_default(self):
        return ConstantesSenseursPassifs.EXCHANGE_DEFAUT

    # async def requete_liste_applications_deployees(self, sid: str, message: dict):
    #     return await self.executer_requete(sid, message, Constantes.DOMAINE_CORE_TOPOLOGIE,
    #                                        'listeApplicationsDeployees')

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
