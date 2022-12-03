import {useState, useCallback, useEffect} from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

function Configuration(props) {

    const { workers, usager, infoConnexion } = props

    return (
        <div>
            <h1>Configuration</h1>
            
            <h2>Info de connexion</h2>

            <p>Copier le fichier conn.json sur l'appareil avec Thonny.</p>

            <ConfigurationAppareil usager={usager} infoConnexion={infoConnexion} />

            <ListeAppareilsAttente workers={workers} usager={usager} />
        </div>
    )
}

export default Configuration

function ConfigurationAppareil(props) {
    
    const { usager, infoConnexion } = props

    const [valeur, setValeur] = useState('')
    const [ssid, setSsid] = useState('')
    const [motdepasse, setMotdepasse] = useState('')

    useEffect(()=>{

        if(!usager || !infoConnexion) return ''

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
        if(ssid) v.wifi_ssid = ssid
        if(motdepasse) v.wifi_password = motdepasse

        setValeur(JSON.stringify(v, null, 2))
    }, [usager, infoConnexion, setValeur, ssid, motdepasse])

    const ssidHandler = useCallback(event=>{setSsid(event.currentTarget.value)}, [setSsid])
    const motdepasseHandler = useCallback(event=>{setMotdepasse(event.currentTarget.value)}, [setMotdepasse])

    return (
        <div>
            <p>Configurer WIFI</p>
            <Form>
                <Form.Group className="mb-3" controlId="formSsid">
                    <Form.Label>SSID</Form.Label>
                    <Form.Control type="text" placeholder="MON_WIFI" value={ssid} onChange={ssidHandler} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control type="text" placeholder="e.g. pepiniere" value={motdepasse} onChange={motdepasseHandler} />
                </Form.Group>
            </Form>

            <p>Fichier conn.json</p>
            <pre>{valeur}</pre>
        </div>
    )

}

function ListeAppareilsAttente(props) {

    const { workers } = props

    const uuid_appareil = 'rpi-pico-e6614104033e722b'
    const challenge = [1, 2, 4, 1]

    const [ showModal, setShowModal ] = useState()
    const fermerModalHandler = useCallback(()=>setShowModal(false), [setShowModal])

    const emettreChallenge = useCallback(()=>{
        const commande = { uuid_appareil, challenge }
        workers.connexion.challengeAppareil(commande)
            .catch(err=>console.error('ListeAppareilsAttente error %O', err))
    }, [workers, uuid_appareil, challenge])

    const challengeHandler = useCallback(()=>{
        setShowModal(true)
        emettreChallenge()
    }, [workers, emettreChallenge, setShowModal])

    return (
        <div>
            <h2>Appareils en attente</h2>
            <Button onClick={challengeHandler}>Challenge</Button>
            <ModalChallenge 
                workers={workers}
                show={showModal} 
                challenge={challenge} 
                uuid_appareil={uuid_appareil}
                repeter={emettreChallenge} 
                fermer={fermerModalHandler} />
        </div>
    )
}

function ModalChallenge(props) {

    const { workers, show, uuid_appareil, challenge, repeter, fermer } = props

    const challengeStr = JSON.stringify(challenge)

    const [enCours, setEnCours] = useState(true)

    const signerHandler = useCallback(()=>{
        const commande = { uuid_appareil, challenge }
        setEnCours(true)
        workers.connexion.signerAppareil(commande)
            .then(reponse => {
                console.debug("Reponse signature : %O", reponse)
                fermer()
            })
            .catch(err=>console.error('ListeAppareilsAttente error %O', err))
            .finally(()=>setEnCours(false))

    }, [workers, fermer, setEnCours])

    useEffect(()=>{
        // Attente initiale apres emission du challenge
        if(show) {
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
                Appareil : {uuid_appareil}
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
                <Button variant="secondary" onClick={repeter} disabled={enCours}>Repeter</Button>
                <Button variant="secondary" onClick={fermer}>Annuler</Button>
            </Modal.Footer>
        </Modal>
    )
}