import asyncio
import logging

from millegrilles_messages.messages import Constantes
from millegrilles_messages.messages.ValidateurCertificats import CertificatInconnu
from millegrilles_web.SocketIoHandler import SocketIoHandler, ErreurAuthentificationMessage

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
        self._sio.on('getConfigurationUsager', handler=self.get_configuration_usager)
        self._sio.on('majConfigurationUsager', handler=self.maj_configuration_usager)

        self._sio.on('ecouterEvenementsAppareilsUsager', handler=self.ecouter_appareils_usager)
        self._sio.on('retirerEvenementsAppareilsUsager', handler=self.retirer_appareils_usager)

    @property
    def exchange_default(self):
        return ConstantesSenseursPassifs.EXCHANGE_DEFAUT

    async def requete_appareils_usager(self, sid: str, message: dict):
        return await self.executer_requete(sid, message,
                                           ConstantesSenseursPassifs.NOM_DOMAINE, 'getAppareilsUsager')

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

    async def get_configuration_usager(self, sid: str, message: dict):
        return await self.executer_requete(sid, message,
                                           ConstantesSenseursPassifs.NOM_DOMAINE, 'getConfigurationUsager')

    async def maj_configuration_usager(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'majConfigurationUsager')

    async def maj_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'majAppareil')

    async def commande_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            'senseurspassifs_relai', 'commandeAppareil')

    async def supprimer_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'supprimerAppareil')

    async def restaurer_appareil(self, sid: str, message: dict):
        return await self.executer_commande(sid, message,
                                            ConstantesSenseursPassifs.NOM_DOMAINE, 'restaurerAppareil')

    # Listeners

    async def ecouter_appareils_usager(self, sid: str, message: dict):
        # "ecouterEvenementsActivationFingerprint"

        async with self._sio.session(sid) as session:
            try:
                enveloppe = await self.authentifier_message(session, message)
                user_id = enveloppe.get_user_id
            except ErreurAuthentificationMessage as e:
                return self.etat.formatteur_message.signer_message(
                    Constantes.KIND_REPONSE, {'ok': False, 'err': str(e)})[0]

        exchanges = [Constantes.SECURITE_PRIVE]
        routing_keys = [
            f'evenement.SenseursPassifs.{user_id}.lectureConfirmee',
            f'evenement.SenseursPassifs.{user_id}.majAppareil',
        ]

        reponse = await self.subscribe(sid, message, routing_keys, exchanges, enveloppe=enveloppe)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)

        return reponse_signee

    async def retirer_appareils_usager(self, sid: str, message: dict):
        # "retirerEvenementsActivationFingerprint"
        # Note : message non authentifie (sans signature)

        async with self._sio.session(sid) as session:
            try:
                enveloppe = await self.authentifier_message(session, message)
                user_id = enveloppe.get_user_id
            except (CertificatInconnu, ErreurAuthentificationMessage) as e:
                return self.etat.formatteur_message.signer_message(
                    Constantes.KIND_REPONSE, {'ok': False, 'err': str(e)})[0]

        exchanges = [Constantes.SECURITE_PRIVE]
        routing_keys = [
            f'evenement.SenseursPassifs.{user_id}.lectureConfirmee',
            f'evenement.SenseursPassifs.{user_id}.majAppareil',
        ]

        reponse = await self.unsubscribe(sid, message, routing_keys, exchanges)
        reponse_signee, correlation_id = self.etat.formatteur_message.signer_message(Constantes.KIND_REPONSE, reponse)

        return reponse_signee
