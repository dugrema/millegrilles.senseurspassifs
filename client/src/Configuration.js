import {useState, useCallback, useEffect} from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

function Configuration(props) {

    const { usager, infoConnexion, setSectionAfficher } = props

    console.debug("PROPPIES %O", props)

    return (
        <div>
            <h1>Configuration</h1>
            
            <h2>Info de connexion</h2>

            <p>Copier le fichier conn.json sur l'appareil avec Thonny.</p>

            <ConfigurationAppareil usager={usager} infoConnexion={infoConnexion} />
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
            <p>Fichier conn.json</p>
            <pre>{valeur}</pre>

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
        </div>
    )

}