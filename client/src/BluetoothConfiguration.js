import {useState, useCallback, useEffect, useMemo} from 'react'

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

import { MESSAGE_KINDS } from '@dugrema/millegrilles.utiljs/src/constantes'
import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import { genererKeyPairX25519 } from '@dugrema/millegrilles.utiljs/src/chiffrage.x25519'

import millegrillesServicesConst from './services.json'
import useWorkers, { useUsager } from './WorkerContext'

import { 
    verifierBluetoothAvailable, requestDevice, authentifier as bleAuthentifier, chargerEtatAppareil, 
    submitConfiguration as bleSubmitConfiguration, submitWifi as bleSubmitWifi,
    transmettreDictChiffre, 
    decoderLectures as bleDecoderLectures, decoderWifi as bleDecoderWifi,
    addEventListener as bleAddEventListener, removeEventListener as bleRemoveEventListener
} from './bluetoothCommandes'

function ConfigurationBluetooth(props) {

    const [bluetoothActif, setBluetoothActif] = useState('')
    
    useEffect(()=>{
        verifierBluetoothAvailable()
            .then(setBluetoothActif)
    }, [setBluetoothActif])

    if(bluetoothActif === '') return <p>Detection Bluetooth</p>
    if(!bluetoothActif) return <BluetoothNonSupporte />
    return <BluetoothSupporte />
}

export default ConfigurationBluetooth

function BluetoothNonSupporte(props) {

    const [jsonConfiguration, setJsonConfiguration] = useState('')

    const workers = useWorkers(),
          usager = useUsager()

    const genererCleHandler = useCallback(async () => {
        if(!usager) return ''

        // console.debug("Usager ", usager)

        const caPem = usager.ca

        const instanceUrl = new URL(window.location.href)
        instanceUrl.pathname = ''
        let instanceUrlString = instanceUrl.href
        if(instanceUrlString.endsWith('/')) instanceUrlString = instanceUrlString.substring(0, instanceUrlString.length-1)

        const serveurRelai = new URL(window.location.href)
        serveurRelai.pathname = ''

        const keyPair = genererKeyPairX25519()
        const privateString = Buffer.from(keyPair.private).toString('hex')
        const publicString = Buffer.from(keyPair.public).toString('hex')
        // console.debug("Keypair : %O, private: %s, public %s", keyPair, privateString, publicString)

        const now = Math.floor(new Date().getTime()/1000)
        const duree = 12 * 3600  // 12 h
        const expiration = now + duree

        const commande = {
            "relai": serveurRelai.href,
            "pubkey": publicString,
            "exp": expiration,
        }

        const messageSigne = await workers.chiffrage.formatterMessage(
            commande, 'SenseursPassifs',
            {kind: MESSAGE_KINDS.KIND_COMMANDE, action: 'authentifier'}
        )
        messageSigne.millegrille = caPem
        messageSigne.attachements = {'privateKey': privateString}
        // setJsonConfiguration(JSON.stringify(messageSigne, null, 2))                
        return JSON.stringify(messageSigne)
    }, [workers, usager])

    useEffect(()=>{
        const cb = () => {
            genererCleHandler()
                .then(setJsonConfiguration)
                .catch(err=>console.error("Erreur preparation cle auth", err))
        }
        cb()  // Generer cle
        
        // Regenerer cle a toutes les 5 minutes
        const interval = setInterval(cb, 300_000)
        return () => {
            clearInterval(interval)
        }
    }, [genererCleHandler, setJsonConfiguration])


    return (
        <div>
            <br/>
            <Alert variant='warning'>
                <Alert.Heading>Non supporte</Alert.Heading>
                <p>La configuration avec Bluetooth n'est pas supportee sur ce navigateur.</p>
                <ul>
                    <li>
                        Sur appareil mobile Apple, utiliser le 
                        navigateur <a href="https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055">Bluefy</a> avec
                        la configuration ci-bas.
                    </li>
                    <li>Sur autres types d'appareil, utilisez Chrome ou Chromium.</li>
                </ul>
            </Alert>

            <h3>Configuration manuelle</h3>
            <p>
                Cliquer sur le bouton pour copier la configuration en memoire (clipboard).
            </p>
            <ConfigurationJson show={!!jsonConfiguration} jsonConfiguration={jsonConfiguration} />
            <p>
                Utilisez un navigateur qui supporte bluetooth et ouvrir la 
                page <a href="http://millegrilles.com/bluetooth" target="_blank">millegrilles.com/bluetooth</a>. 
            </p>
        </div>
    )
}

function ConfigurationJson(props) {

    const { jsonConfiguration } = props

    const [showJson, setShowJson] = useState(false)
    const [copieOk, setCopieOk] = useState(false)

    const copierClipboard = useCallback(()=>{
        navigator.clipboard.writeText(jsonConfiguration)
        setCopieOk(true)
        setTimeout(()=>setCopieOk(false), 5_000)
    }, [jsonConfiguration, setCopieOk])

    if(!props.show) return ''

    return (
        <div>
            {showJson?
                <pre>{jsonConfiguration}</pre>
            :''}
            
            <p>
                <Button variant={copieOk?'success':'primary'} onClick={copierClipboard} disabled={!!copieOk}>
                    <span>Copie <i className="fa fa-key"/></span>
                </Button>
                {copieOk?<span>{' '}Cle copiee en memoire <i className='fa fa-check'/></span>:''}
            </p>
        </div>
    )
}

function BluetoothSupporte(props) {

    const workers = useWorkers()

    const [devices, setDevices] = useState('')
    const [deviceSelectionne, setDeviceSelectionne] = useState('')
    const [bluetoothServer, setBluetoothServer] = useState('')
    const [authSharedSecret, setAuthSharedSecret] = useState('')

    const [ssid, setSsid] = useState('')
    const [wifiPassword, setWifiPassword] = useState('')
    const [relai, setRelai] = useState('')    

    const fermerAppareilCb = useCallback(()=>{
        setDeviceSelectionne('')
        setBluetoothServer('')
        setAuthSharedSecret('')
    }, [setDeviceSelectionne, setBluetoothServer, setAuthSharedSecret])

    const authentifierHandler = useCallback(()=>{
        setAuthSharedSecret('')
        bleAuthentifier(workers, bluetoothServer)
            .then(result=>{
                console.debug("Authentifier resultat : ", result)
                if(result && result.sharedSecret) {
                    setAuthSharedSecret(result.sharedSecret)
                } else {
                    setAuthSharedSecret(false)
                }
            })
            .catch(err=>{
                console.error("Erreur BLE authentifier ", err)
                setAuthSharedSecret(false)
            })
    }, [workers, bluetoothServer, setAuthSharedSecret])

    useEffect(()=>{
        if(!deviceSelectionne) return
        deviceSelectionne.addEventListener('gattserverdisconnected', ()=>fermerAppareilCb('bluetooth deconnecte'))
    }, [deviceSelectionne])

    useEffect(()=>{
        if(bluetoothServer && bluetoothServer.connected) {
            authentifierHandler()
        }
    }, [bluetoothServer, authentifierHandler, fermerAppareilCb])

    // const selectionnerDevice = useCallback(deviceId=>{
    //     console.debug("Selectioner device %s", deviceId)
    //     bluetooth.getDevices()
    //         .then(devices=>{
    //             for(const device of devices) {
    //                 if(device.id === deviceId) {
    //                     console.debug("Device trouve ", device)
    //                     setDeviceSelectionne(device)
    //                     return
    //                 }
    //             }
    //             console.error("Device Id %s inconnu", deviceId)
    //         })
    //         .catch(err=>console.error("Erreur getDevices", err))
    // }, [setDeviceSelectionne])

    // const refreshDevices = useCallback(()=>{
    //     console.debug("Refresh devices")
    //     if('getDevices' in bluetooth) {
    //         bluetooth.getDevices()
    //             .then(devices=>{
    //                 const deviceCopy = devices.reduce((acc, item)=>{
    //                     acc[item.id] = {name: item.name}
    //                     return acc
    //                 }, {})
    //                 console.debug("Devices deja paires : %O", devices)
    //                 setDevices(deviceCopy)
    //             })
    //             .catch(err=>console.error("Erreur chargement devices deja paires ", err))
    //     }
    // }, [setDevices])

    // useEffect(()=>{
    //     // Charger devices
    //     refreshDevices()
    // }, [refreshDevices])

    const scanCb = useCallback(()=>{
        console.debug("Request device")
        requestDevice()
            .then(device=>{
                if(!device) return  // Cancelled

                const devicesCopy = {...devices}
                const deviceId = device.id
                devicesCopy[deviceId] = {name: device.name}
                setBluetoothServer('')  // Toggle deconnexion au besoin
                setDevices(devicesCopy)
                setDeviceSelectionne(device)
            })
            .catch(err=>console.error("Erreur chargement device ", err))
    }, [devices, setDevices, setDeviceSelectionne])

    useEffect(()=>{
        let connexion = null
        if(deviceSelectionne) {
            // Se connecter
            console.debug("Connexion bluetooth a %O", deviceSelectionne)
            deviceSelectionne.gatt.connect()
                .then(server=>{
                    setBluetoothServer(server)
                    connexion = server
                })
                .catch(err=>console.error("Erreur connexion bluetooth", err))

            return () => {
                if(connexion) {
                    console.debug("Deconnexion bluetooth de %O", connexion)
                    connexion.disconnect()
                        // .catch(err=>console.error("Erreur deconnexion bluetooth", err))
                    fermerAppareilCb()
                }
            }                
        }
    }, [deviceSelectionne, setBluetoothServer, fermerAppareilCb])

    if(bluetoothServer) return (
        <div>
            <ConfigurerAppareilSelectionne 
                deviceSelectionne={deviceSelectionne} 
                server={bluetoothServer} 
                ssid={ssid}
                wifiPassword={wifiPassword}
                relai={relai} 
                authSharedSecret={authSharedSecret} 
                authentifier={authentifierHandler}
                fermer={fermerAppareilCb} />
        </div>
    )

    return (
        <div>
            <ValeursConfiguration 
                ssid={ssid}
                setSsid={setSsid}
                wifiPassword={wifiPassword}
                setWifiPassword={setWifiPassword}
                relai={relai}
                setRelai={setRelai} />

            <p>Le boutons suivant permet de trouver un appareil avec bluetooth.</p>

            <p>
                <Button variant="primary" onClick={scanCb}>Scan</Button>{' '}
            </p>
        </div>
    )
}

function AuthentifierAppareil(props) {

    const { show, authSharedSecret, authentifier } = props

    const messageEtat = useMemo(()=>{
        if(authSharedSecret === '') return <span>En cours <i className="fa fa-spinner fa-spin"/></span>
        if(authSharedSecret === false) return (
            <span>Echec <Button variant="secondary" onClick={authentifier}>Ressayer</Button></span>
        )
        if(authSharedSecret) return <span>OK</span>
        return <span>Erreur</span>
    }, [authSharedSecret, authentifier])

    if(!show) return ''

    return (
        <Row>
            <Col xs={12} md={3}>Authentification</Col>
            <Col>{messageEtat}</Col>
        </Row>
    )
}

function sortDevices(a, b) {
    if(a === b) {} 
    else if(!a) return 1
    else if(!b) return -1
    
    let comp = a.name.localeCompare(b.name)
    if(comp !== 0) return comp

    return a.id.localeCompare(b.id)
}

// async function requestDevice() {
//     let device = null
//     const commandesUuid = millegrillesServicesConst.services.commandes.uuid,
//           etatUuid  = millegrillesServicesConst.services.etat.uuid,
//           environmentalUuid = 0x181a
//     console.debug("Services %s, %s", commandesUuid, etatUuid)
//     try {
//         device = await bluetooth.requestDevice({
//             // Requis : service de configuration
//             // filters: [{services: [etatUuid]}],
//             filters: [{services: [commandesUuid]}],
//             // Optionnels - requis par Chrome sur Windows (permission d'acces)
//             // optionalServices: [configurerUuid, environmentalUuid],
//             optionalServices: [etatUuid, environmentalUuid],
//         })
//     } catch(err) {
//         if(err.code === 8) {
//             // Cancel
//             return
//         }
//         // Reessayer sans optionalServices (pour navigateur bluefy)
//         device = await bluetooth.requestDevice({
//             // Requis : service de configuration
//             filters: [{services: [commandesUuid, etatUuid]}],
//         })
//     }
//     console.debug("Device choisi ", device)
//     return device
// }

function ConfigurerAppareilSelectionne(props) {
    const { deviceSelectionne, server, ssid, wifiPassword, relai, authSharedSecret, authentifier, fermer } = props

    const workers = useWorkers()

    const [etatAppareil, setEtatAppareil] = useState('')
    const [autoUpdate, setAutoUpdate] = useState(true)
    const [lecturesMaj, setLecturesMaj] = useState('')

    const etatCharge = useMemo(()=>{
        return !!etatAppareil
    }, [etatAppareil])

    const rafraichir = useCallback(()=>{
        if(!server.connected) {
            console.warn("Connexion bluetooth coupee")
            fermer()
        }
        chargerEtatAppareil(server)
            .then(etat=>{
                console.debug("Etat appareil %O", etat)
                setEtatAppareil(etat)
            })
            .catch(err=>{
                console.debug("Erreur chargement etat appareil ", err)
                fermer()
            })
    }, [server, setEtatAppareil, fermer])

    const updateLecturesHandler = useCallback( e => {
        console.debug("Event lectures : ", e)
        try {
            const valeur = e.target.value
            const etatLectures = bleDecoderLectures(valeur)
            // console.debug("Lectures decode : ", etatLectures)
            setLecturesMaj(etatLectures)
        } catch(err) {
            console.error("Erreur decodage lectures ", err)
        }
    }, [setLecturesMaj])

    const updateWifiHandler = useCallback(e => {
        // console.debug("Event wifi : ", e)
        try {
            const valeur = e.target.value
            const etatWifi = bleDecoderWifi(valeur)
            // console.debug("Wifi decode : ", etatWifi)
            setLecturesMaj(etatWifi)
        } catch(err) {
            console.error("Erreur decodage lectures ", err)
        }
    }, [setLecturesMaj])    

    const rebootCb = useCallback(()=>{
        const commande = { commande: 'reboot' }
        transmettreDictChiffre(workers, server, authSharedSecret, commande)
            .then(()=>{
                console.debug("Commande reboot transmise")
            })
            .catch(err=>console.error("Erreur reboot ", err))
    }, [workers, server, authSharedSecret])

    useEffect(()=>{
        if(!lecturesMaj) return
        const maj = {...etatAppareil, ...lecturesMaj}
        setLecturesMaj('')
        setEtatAppareil(maj)
    }, [etatAppareil, setEtatAppareil, lecturesMaj, setLecturesMaj])

    useEffect(()=>{
        if(server.connected && autoUpdate) {
            rafraichir()
            const interval = setInterval(rafraichir, 7_500)
            return () => {
                console.info("Desactiver polling BLE")
                clearInterval(interval)
            }
        }
    }, [server, rafraichir, autoUpdate])

    useEffect(()=>{
        if(server.connected && etatCharge) {
            const etatUuid = millegrillesServicesConst.services.etat.uuid
            const lecturesUuid = millegrillesServicesConst.services.etat.characteristics.getLectures
            const wifiUuid = millegrillesServicesConst.services.etat.characteristics.getWifi
            bleAddEventListener(server, etatUuid, lecturesUuid, updateLecturesHandler)
                .then(()=>bleAddEventListener(server, etatUuid, wifiUuid, updateWifiHandler))
                .then(()=>setAutoUpdate(false))
                .catch(err=>console.error("Erreur ajout listener sur lectures/wifi", err))
    
            return () => {
                bleRemoveEventListener(server, etatUuid, lecturesUuid, updateLecturesHandler)
                    .catch(err=>console.error("Erreur retrait listener sur lectures", err))
                bleRemoveEventListener(server, etatUuid, wifiUuid, updateWifiHandler)
                    .catch(err=>console.error("Erreur retrait listener sur lectures", err))
            }
        }
    }, [server, etatCharge, updateLecturesHandler, updateWifiHandler, setAutoUpdate])

    if(!server) return ''

    return (
        <div>
            <Row>
                <Col xs={9} md={10} lg={11}>
                    <h3>{deviceSelectionne.name}</h3>
                </Col>
                <Col>
                    <br/>
                    <Button variant="secondary" onClick={fermer}>X</Button>
                </Col>
            </Row>

            <EtatAppareil value={etatAppareil} />
            
            <AuthentifierAppareil 
                show={!!etatAppareil} 
                authSharedSecret={authSharedSecret} 
                authentifier={authentifier} />

            <EtatLectures value={etatAppareil} server={server} authSharedSecret={authSharedSecret} />
            
            <SoumettreConfiguration 
                show={!!etatAppareil}
                server={server} 
                ssid={ssid}
                wifiPassword={wifiPassword}
                relai={relai} />

            <p></p>
            <hr/>
            <Button variant="danger" onClick={rebootCb} disabled={!authSharedSecret}>Reboot</Button>
            <p></p>
            <p></p>
        </div>
    )
}

function EtatAppareil(props) {
    const { value } = props

    if(!value) return ''

    return (
        <div>
            <Row><Col xs={12} md={3}>Idmg</Col><Col>{value.idmg}</Col></Row>
            <Row><Col xs={12} md={3}>User id</Col><Col>{value.userId}</Col></Row>

            <Row><Col xs={6} sm={4} md={3}>WIFI SSID</Col><Col>{value.ssid}</Col></Row>
            <Row><Col xs={6} sm={4} md={3}>WIFI ip</Col><Col>{value.ip}</Col></Row>
            <Row><Col xs={6} sm={4} md={3}>WIFI subnet</Col><Col>{value.subnet}</Col></Row>
            <Row><Col xs={6} sm={4} md={3}>WIFI gateway</Col><Col>{value.gateway}</Col></Row>
            <Row><Col xs={6} sm={4} md={3}>WIFI dns</Col><Col>{value.dns}</Col></Row>
        </div>
    )
}

function EtatLectures(props) {
    const { value, server, authSharedSecret } = props

    if(!value) return ''

    return (
        <div>
            <p></p>

            <Row><Col xs={6} sm={4} md={3}>Ntp sync</Col><Col>{value.ntp?'Oui':'Non'}</Col></Row>
            <Row><Col xs={6} sm={4} md={3}>Heure</Col><Col><FormatterDate value={value.time}/></Col></Row>
            <ValeurTemperature value={value.temp1} label='Temperature 1' />
            <ValeurTemperature value={value.temp2} label='Temperature 2' />
            <ValeurHumidite value={value.hum} />
            <SwitchBluetooth value={value.switches[0]} idx={0} label='Switch 1' server={server} authSharedSecret={authSharedSecret} />
            <SwitchBluetooth value={value.switches[1]} idx={1} label='Switch 2' server={server} authSharedSecret={authSharedSecret} />
            <SwitchBluetooth value={value.switches[2]} idx={2} label='Switch 3' server={server} authSharedSecret={authSharedSecret} />
            <SwitchBluetooth value={value.switches[3]} idx={3} label='Switch 4' server={server} authSharedSecret={authSharedSecret} />
        </div>
    )
}

function ValeurTemperature(props) {
    const { value, label } = props

    if(!value) return ''

    return (
        <Row><Col xs={6} sm={4} md={3}>{label||'Temperature'}</Col><Col>{value}&deg;C</Col></Row>
    )
}

function ValeurHumidite(props) {
    const { value, label } = props

    if(!value) return ''

    return (
        <Row><Col xs={6} sm={4} md={3}>{label||'Humidite'}</Col><Col>{value}%</Col></Row>
    )
}

// async function transmettreDictChiffre(workers, server, authSharedSecret, commande) {
//     const commandeString = JSON.stringify(commande)
//     const commandeBytes = new TextEncoder().encode(commandeString)

//     const resultat = await workers.chiffrage.chiffrage.chiffrer(
//         commandeBytes, {cipherAlgo: 'chacha20-poly1305', key: authSharedSecret}
//     )
//     console.debug("Commande chiffree : %O (key input: %O)", resultat, authSharedSecret)
//     const ciphertext = Buffer.from(resultat.ciphertext).toString('base64')
//     const commandeChiffree = {
//         ciphertext,
//         nonce: Buffer.from(resultat.nonce.slice(1), 'base64').toString('base64'),  // Retrirer m multibase, utiliser base64 padding
//         tag: Buffer.from(resultat.rawTag).toString('base64'),
//     }
//     const cb = async characteristic => {
//         await transmettreDict(characteristic, commandeChiffree)
//     }
//     const commandeUuid = millegrillesServicesConst.services.commandes.uuid,
//           setCommandUuid = millegrillesServicesConst.services.commandes.characteristics.setCommand
//     await submitParamAppareil(server, commandeUuid, setCommandUuid, cb)
// }

function SwitchBluetooth(props) {
    const { value, label, idx, server, authSharedSecret } = props

    const workers = useWorkers()

    const commandeSwitchCb = useCallback(e=>{
        const { name, value } = e.currentTarget
        const idx = Number.parseInt(name)
        const valeur = value==='1'
        const commande = { commande: 'setSwitchValue', idx, valeur }
        transmettreDictChiffre(workers, server, authSharedSecret, commande)
            .then(()=>{
                console.debug("Commande switch transmise")
            })
            .catch(err=>console.error("Erreur switch BLE : ", err))
    }, [workers, idx, server, authSharedSecret])

    if(!value.present) return ''

    return (
        <Row>
            <Col xs={6} sm={4} md={3}>{label||'Switch'}</Col>
            <Col>{value.valeur?'ON':'OFF'}</Col>
            <Col>
                <Button variant="secondary" name={''+idx} value="1" onClick={commandeSwitchCb} disabled={!authSharedSecret}>ON</Button>{' '}
                <Button variant="secondary" name={''+idx} value="0" onClick={commandeSwitchCb} disabled={!authSharedSecret}>OFF</Button>
            </Col>
        </Row>
    )
}

function ValeursConfiguration(props) {

    const { ssid, setSsid, wifiPassword, setWifiPassword, relai, setRelai } = props

    const usager = useUsager()

    // Initialiser url relai
    useEffect(()=>{
        const relaiUrl = new URL(window.location.href)
        relaiUrl.pathname = ''
        setRelai(relaiUrl.href)
    }, [setRelai])

    return (
        <div>
            <h3>Configuration des appareils</h3>
            <Row>
                <Col xs={6} md={2}>
                    <Form.Label>Nom Wifi (SSID)</Form.Label>
                </Col>
                <Col xs={6} md={4}>
                    <Form.Control type="text" placeholder="Exemple : Bell1234" value={ssid} onChange={e=>setSsid(e.currentTarget.value)} />
                </Col>
                <Col xs={6} md={2}>
                    <Form.Label>Mot de passe</Form.Label>
                </Col>
                <Col xs={6} md={4}>
                    <Form.Control type="password" value={wifiPassword} onChange={e=>setWifiPassword(e.currentTarget.value)} />
                </Col>
            </Row>

            <p></p>
            <Form.Group controlId="formRelai">
                <Form.Label>URL serveur</Form.Label>
                <Form.Control type="text" placeholder="https://millegrilles.com/senseurspassifs_relai ..." value={relai} onChange={e=>setRelai(e.currentTarget.value)} />
                <p>La valeur par defaut est correcte dans la plupart des cas.</p>
            </Form.Group>
            <p></p>
        </div>
    )
}

function SoumettreConfiguration(props) {

    const { show, server, ssid, wifiPassword, relai } = props

    const usager = useUsager()
    const userId = usager.extensions.userId,
          idmg = usager.idmg

    const [messageSucces, setMessageSucces] = useState('')
    const [messageErreur, setMessageErreur] = useState('')

    const messageSuccesCb = useCallback(m=>{
        setMessageSucces(m)
        setTimeout(()=>setMessageSucces(''), 5_000)
    }, [setMessageSucces])

    const submitConfigurationServer = useCallback(e=>{
        console.debug("Submit usager ", e)
        e.stopPropagation()
        e.preventDefault()

        bleSubmitConfiguration(server, relai, idmg, userId)
            .then(()=>{
                console.debug("Params configuration envoyes")
                messageSuccesCb('Les parametres serveur ont ete transmis correctement.')
            })
            .catch(err=>{
                console.error("Erreur sauvegarde parametres serveur", err)
                setMessageErreur({err, message: 'Les parametres serveur n\'ont pas ete recus par l\'appareil.'})
            })

        // const commandesUuid = millegrillesServicesConst.services.commandes.uuid,
        //       setCommandUuid = millegrillesServicesConst.services.commandes.characteristics.setCommand

        // // Transmettre relai
        // const cbRelai = async characteristic => {
        //     const params = {commande: 'setRelai', relai}
        //     await transmettreDict(characteristic, params)
        // }
        // const cbUser = async characteristic => {
        //     const params = {commande: 'setUser', idmg, user_id: userId}
        //     await transmettreDict(characteristic, params)
        // }

        // Promise.resolve()
        //     .then(async ()=>{
        //         await submitParamAppareil(server, commandesUuid, setCommandUuid, cbRelai)
        //         console.debug("Params relai envoyes")
        //         await submitParamAppareil(server, commandesUuid, setCommandUuid, cbUser)
        //         console.debug("Params user envoyes")
        //         messageSuccesCb('Les parametres serveur ont ete transmis correctement.')
        //     })
        //     .catch(err=>{
        //         console.error("Erreur sauvegarde parametres serveur", err)
        //         setMessageErreur({err, message: 'Les parametres serveur n\'ont pas ete recus par l\'appareil.'})
        //     })
    }, [server, idmg, userId, relai, messageSuccesCb, setMessageErreur])

    const submitWifi = useCallback(e=>{
        console.debug("Submit wifi ", e)
        e.stopPropagation()
        e.preventDefault()

        bleSubmitWifi(server, ssid, wifiPassword)
            .then(()=>{
                messageSuccesCb('Les parametres wifi ont ete transmis correctement.')
            })
            .catch(err=>{
                console.error("Erreur submit wifi ", err)
                setMessageErreur({err, message: 'Les parametres wifi n\'ont pas ete recus par l\'appareil.'})
            })
    
        // const cb = async characteristic => {
        //     const params = {commande: 'setWifi', ssid, password: wifiPassword}
        //     await transmettreDict(characteristic, params)
        // }

        // const commandeUuid = millegrillesServicesConst.services.commandes.uuid,
        //       setCommandUuid = millegrillesServicesConst.services.commandes.characteristics.setCommand

        // submitParamAppareil(server, commandeUuid, setCommandUuid, cb).then(()=>{
        //     messageSuccesCb('Les parametres wifi ont ete transmis correctement.')
        // })
        // .catch(err=>{
        //     console.error("Erreur submit wifi ", err)
        //     setMessageErreur({err, message: 'Les parametres wifi n\'ont pas ete recus par l\'appareil.'})
        // })

    }, [server, ssid, wifiPassword, messageSuccesCb, setMessageErreur])

    if(!show) return ''

    return (
        <div>
            <br/>
            <p>Utilisez les boutons suivants pour modifier la configuration de l'appareil.</p>
            <Alert variant='success' show={!!messageSucces}>
                <Alert.Heading>Succes</Alert.Heading>
                <p>{messageSucces}</p>
            </Alert>
            <Alert variant='danger' show={!!messageErreur}>
                <Alert.Heading>Erreur</Alert.Heading>
                <p>{messageErreur.message}</p>
                <p>{''+messageErreur.err}</p>
            </Alert>
            <Button variant="secondary" onClick={submitWifi} disabled={!ssid||!wifiPassword}>Changer wifi</Button>{' '}
            <Button variant="secondary" onClick={submitConfigurationServer} disabled={!relai}>Configurer serveur</Button>
            <p></p>
        </div>
    )
}
