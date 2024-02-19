import {lazy, useState, useCallback, useEffect, useMemo} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'

import { getRandom } from '@dugrema/millegrilles.utiljs/src/random'

import useWorkers, {useUsager, useInfoConnexion} from './WorkerContext'

import { push as pushAppareils } from './redux/appareilsSlice'
import { OptionsTimezones } from './timezones'

const BluetoothConfiguration = lazy(()=>import('./BluetoothConfiguration'))

function Configuration(props) {

    const [tabSelectionne, setTabSelectionne] = useState('nouveaux')

    return (
        <div>
            <h1>Configuration</h1>
            
            <Tabs activeKey={tabSelectionne} onSelect={setTabSelectionne}>
                <Tab eventKey="nouveaux" title="Nouveaux">
                    <ListeAppareilsAttente disabled={tabSelectionne!=='nouveaux'} />
                </Tab>
                <Tab eventKey="compte" title="Compte">
                    <ConfigurationCompte />
                </Tab>
                <Tab eventKey="bluetooth" title="Bluetooth">
                    <BluetoothConfiguration />
                </Tab>
            </Tabs>
            
        </div>
    )
}

export default Configuration


function ConfigurationCompte(props) {

    const workers = useWorkers()
    const usager = useUsager()

    const [compteUsager, setCompteUsager] = useState('')
    const [changement, setChangement] = useState(false)
    const [timezone, setTimezone] = useState('')

    const timezoneProps = props.timezone
    useEffect(()=>{
        if(timezoneProps) setTimezone(timezoneProps)
    }, [timezoneProps])

    const timezoneOnChange = useCallback(e=>{
        const tz = e.currentTarget.value
        setTimezone(tz)
        setChangement(true)
    }, [setTimezone, setChangement])

    const sauvegarderCb = useCallback(()=>{
        const nomUsager = usager.nomUsager
        const params = { timezone: timezone?timezone:null }
        console.debug("Sauvegarder params : ", params)
        workers.connexion.majConfigurationUsager(nomUsager, params)
            .then(reponse=>{
                console.debug("Reponse : ", reponse)
            })
            .catch(err=>console.error("Erreur sauvegarer compte usager : ", err))
    }, [usager, timezone])

    const resetCb = useCallback(()=>{
        setTimezone(compteUsager.timezone || '')
        setChangement(false)
    }, [compteUsager, setTimezone, setChangement])

    useEffect(()=>{
        if(!usager || !usager.nomUsager) return
        const nomUsager = usager.nomUsager
        
        workers.connexion.getConfigurationUsager(nomUsager)
            .then(reponse=>{
                console.debug("Reponse configuration usager : ", reponse)
                setCompteUsager(reponse)
                setTimezone(reponse.timezone || '')
            })
            .catch(err=>console.error("Erreur requete configuration usager ", err))
        }, [workers, setCompteUsager, setTimezone])

    return (
        <div>
            <p>Ces parametres vont s'appliquer aux appareils et notifications.</p>
            <Row>
                <Col xs={4} md={3} xl={2}>Fuseau horaire</Col>
                <Col>
                    <Form.Select onChange={timezoneOnChange} value={timezone}>
                        <option value=''>Choisir une valeur</option>
                        <OptionsTimezones />
                    </Form.Select>
                </Col>
            </Row>

            <Row>
                <Col className='button-bar'>
                    <Button disabled={!changement} onClick={sauvegarderCb}>Sauvegarder</Button>
                    <Button variant="secondary" onClick={resetCb} disabled={!changement}>Reset</Button>
                </Col>
            </Row>
        </div>
    )
}

function ListeAppareilsAttente(props) {

    const { disabled } = props

    const workers = useWorkers()
    const dispatch = useDispatch()

    const rafraichir = useCallback(()=>{
        workers.connexion.getAppareilsEnAttente()
            .then(reponse => {
                console.debug("Reponse appareils en attente ", reponse)
                dispatch(pushAppareils({liste: reponse.appareils, clear: true}))
            })
            .catch(err=>console.error("Erreur chargement appareils en attente : %O", err))
    }, [dispatch, workers, disabled])

    useEffect(()=>{
        if(disabled) return
        rafraichir()
        const interval = setInterval(rafraichir, 10_000)
        return () => {
            clearInterval(interval)
        }
    }, [rafraichir, disabled])

    return (
        <div>
            <h2>Appareils en attente</h2>
            <AppareilsCommandes />
            <AfficherAppareils />
        </div>
    )
}

function AppareilsCommandes(props) {

    const workers = useWorkers()

    const clearCertificats = useCallback(()=>{
        workers.connexion.resetCertificatsAppareils()
            .then(reponse => {
                console.debug("Reponse reset certificats ", reponse)
            })
            .catch(err=>console.error("Erreur reset certificats : %O", err))
    }, [workers])

    return (
        <>
            <Button variant="secondary" onClick={clearCertificats}>Clear certificats (debug)</Button>{' '}
        </>
    )
}

function AfficherAppareils(props) {

    const [ uuidAppareil, setUuidAppareil ] = useState('')
    const fermerModalHandler = useCallback(()=>setUuidAppareil(''), [setUuidAppareil])

    const appareils = useSelector(state=>state.appareils.listeAppareils)

    const challengeHandler = useCallback(event=>{
        const uuidAppareil = event.currentTarget.value
        setUuidAppareil(uuidAppareil)
    }, [setUuidAppareil])

    if(!appareils) return ''

    return (
        <div>
            <h2>Disponibles</h2>

            {
                appareils.map(item=>{
                    console.debug("Afficher %O", item)
                    const uuidAppareil = item.uuid_appareil
                    return (
                        <Row key={uuidAppareil}>
                            <Col xs={3} md={2} xl={1}>
                                <Button variant="secondary" onClick={challengeHandler} value={uuidAppareil}>Ajouter</Button>
                            </Col>
                            <Col>{uuidAppareil}</Col>
                        </Row>
                    )
                })
            }

            <ModalChallenge 
                show={!!uuidAppareil} 
                uuidAppareil={uuidAppareil}
                fermer={fermerModalHandler} />
        </div>
    )
}

function ModalChallenge(props) {

    const { show, uuidAppareil, fermer } = props

    const workers = useWorkers()

    const [enCours, setEnCours] = useState(true)

    const challenge = useMemo(()=>{
        if(!show) return ''
        let randomVal = getRandom(1)[0]
        const sequence = []
        for(let i=0; i<4; i++) {
            const dig = (randomVal & 0x03) + 1
            console.debug("Randomval : %O, digit : %O", randomVal, dig)
            sequence.push(dig)
            randomVal = randomVal >> 2
        }
        console.debug("RandomVal %O", sequence)
        return sequence
    }, [show])

    const challengeStr = JSON.stringify(challenge)

    const emettreChallenge = useCallback(()=>{
        const commande = { uuid_appareil: uuidAppareil, challenge }
        workers.connexion.challengeAppareil(commande)
            .catch(err=>console.error('ListeAppareilsAttente error %O', err))
    }, [workers, uuidAppareil, challenge])

    const signerHandler = useCallback(()=>{
        const commande = { uuid_appareil: uuidAppareil, challenge }
        setEnCours(true)
        workers.connexion.signerAppareil(commande)
            .then(reponse => {
                console.debug("Reponse signature : %O", reponse)
                fermer()
            })
            .catch(err=>console.error('ListeAppareilsAttente error %O', err))
            .finally(()=>setEnCours(false))

    }, [workers, uuidAppareil, fermer, setEnCours])

    useEffect(()=>{
        // Attente initiale apres emission du challenge
        if(show) {
            emettreChallenge()
            setTimeout(()=>setEnCours(false), 2000)
        }
    }, [show, setEnCours])

    return (
        <Modal show={show}>
            <Modal.Header>
                Challenge appareil
            </Modal.Header>
            <p>Le code suivant a ete emis.</p>
            <p>
                Appareil : {uuidAppareil}
            </p>
            <p>
                Code : {challengeStr}
            </p>
            <p>
                Si l'appareil a un ecran, le code devrait s'afficher. 
                Sinon le DEL va flasher selon cette sequence (2 repetitions).
            </p>
            <p>
                Il peut y avoir un delai de 10 secondes avant que la commande ne soit recue.
            </p>
            <Modal.Footer>
                <Button onClick={signerHandler} disabled={enCours}>Approuver</Button>
                <Button variant="secondary" onClick={emettreChallenge} disabled={enCours}>Repeter</Button>
                <Button variant="secondary" onClick={fermer}>Annuler</Button>
            </Modal.Footer>
        </Modal>
    )
}