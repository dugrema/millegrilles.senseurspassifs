import {useState, useCallback, useEffect, useMemo} from 'react'
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


function Configuration(props) {

    const [tabSelectionne, setTabSelectionne] = useState('nouveaux')

    return (
        <div>
            <h1>Configuration</h1>
            
            <Tabs activeKey={tabSelectionne} onSelect={setTabSelectionne}>
                <Tab eventKey="nouveaux" title="Nouveaux">
                    <ListeAppareilsAttente disabled={tabSelectionne!=='nouveaux'} />
                </Tab>
                <Tab eventKey="fichier" title="Fichier">
                    <FichierConfiguration />
                </Tab>
            </Tabs>
            
        </div>
    )
}

export default Configuration


function FichierConfiguration(props) {
    return (
        <div>
            <h2>Fichier de configuration</h2>

            <p>Copier le fichier conn.json sur l'appareil avec Thonny.</p>

            <ConfigurationAppareil />
        </div>        
    )
}


function ConfigurationAppareil(props) {
    
    const infoConnexion = useInfoConnexion()
    const usager = useUsager()

    const [valeur, setValeur] = useState('')
    const [ssid, setSsid] = useState('')
    const [motdepasse, setMotdepasse] = useState('')
    const [copieOk, setCopieOk] = useState(false)

    useEffect(()=>{
        if(!usager || !infoConnexion) return

        const userId = usager.extensions.userId

        const instanceUrl = new URL(window.location.href)
        instanceUrl.pathname = ''
        let instanceUrlString = instanceUrl.href
        if(instanceUrlString.endsWith('/')) instanceUrlString = instanceUrlString.substring(0, instanceUrlString.length-1)

        const v = {
            "idmg": infoConnexion.idmg,
            "user_id": userId,
            "http_instance": instanceUrlString, 
            "http_timeout": 25,
        }
        if(ssid && motdepasse) {
            v.wifis = [{wifi_ssid: ssid, wifi_password: motdepasse}]
        }

        setValeur(JSON.stringify(v, null, 2))
    }, [usager, infoConnexion, setValeur, ssid, motdepasse])

    const ssidHandler = useCallback(event=>{setSsid(event.currentTarget.value)}, [setSsid])
    const motdepasseHandler = useCallback(event=>{setMotdepasse(event.currentTarget.value)}, [setMotdepasse])

    const copierClipboard = useCallback(()=>{
        navigator.clipboard.writeText(valeur)
        setCopieOk(true)
        setTimeout(()=>setCopieOk(false), 5_000)
    }, [valeur, setCopieOk])

    return (
        <div>
            <p>Configurer WIFI</p>
            <Form>
                <Row>
                    <Col>
                        <Form.Group className="mb-3" controlId="formSsid">
                            <Form.Label>SSID</Form.Label>
                            <Form.Control type="text" placeholder="MON_WIFI" value={ssid} onChange={ssidHandler} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Label>Mot de passe</Form.Label>
                            <Form.Control type="text" placeholder="e.g. pepiniere" value={motdepasse} onChange={motdepasseHandler} />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>

            <p>Fichier conn.json</p>
            <pre>{valeur}</pre>

            <Row>
                <Col>
                    <Button onClick={copierClipboard}>Copier</Button>
                    {copieOk?<p>Copie faite <i className='fa fa-check'/></p>:''}
                </Col>
            </Row>
        </div>
    )

}

function ListeAppareilsAttente(props) {

    const { disabled } = props

    const workers = useWorkers()
    const dispatch = useDispatch()

    useEffect(()=>{
        if(disabled) return

        workers.connexion.getAppareilsEnAttente()
            .then(reponse => {
                console.debug("Reponse appareils en attente ", reponse)
                dispatch(pushAppareils({liste: reponse.appareils, clear: true}))
            })
            .catch(err=>console.error("Erreur chargement appareils en attente : %O", err))
    }, [dispatch, workers, disabled])

    return (
        <div>
            <h2>Appareils en attente</h2>
            <AfficherAppareils />
        </div>
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