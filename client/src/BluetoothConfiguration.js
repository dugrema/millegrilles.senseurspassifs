import {useState, useCallback, useEffect, useMemo} from 'react'

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import millegrillesServicesConst from './services.json'
import useWorkers, {useUsager, useInfoConnexion} from './WorkerContext'

const bluetoothSupporte = 'bluetooth' in navigator
const bluetooth = navigator.bluetooth

function ConfigurationBluetooth(props) {

    const usager = useUsager()

    const [jsonConfiguration, setJsonConfiguration] = useState('')

    useEffect(()=>{
        if(!usager) return

        const userId = usager.extensions.userId,
              idmg = usager.idmg

        const instanceUrl = new URL(window.location.href)
        instanceUrl.pathname = ''
        let instanceUrlString = instanceUrl.href
        if(instanceUrlString.endsWith('/')) instanceUrlString = instanceUrlString.substring(0, instanceUrlString.length-1)

        const serveurRelai = new URL(window.location.href)
        serveurRelai.pathname = ''

        const v = {
            idmg,
            "user_id": userId,
            "relai": serveurRelai.href,
        }

        setJsonConfiguration(JSON.stringify(v, null, 2))
    }, [usager, setJsonConfiguration])

    if(!bluetoothSupporte) return <BluetoothNonSupporte jsonConfiguration={jsonConfiguration} />

    return <BluetoothSupporte />
}

export default ConfigurationBluetooth

function BluetoothNonSupporte(props) {

    const { jsonConfiguration } = props

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
                Copiez cette configuration.
            </p>
            <ConfigurationJson show={true} jsonConfiguration={jsonConfiguration} />
            <p>
                Utiliser un navigateur qui supporte bluetooth pour aller sur <a href="http://millegrilles.com/bluetooth" target="_blank">millegrilles.com/bluetooth</a>. 
            </p>
        </div>
    )
}

function ConfigurationJson(props) {

    const { jsonConfiguration } = props

    const [copieOk, setCopieOk] = useState(false)

    const copierClipboard = useCallback(()=>{
        navigator.clipboard.writeText(jsonConfiguration)
        setCopieOk(true)
        setTimeout(()=>setCopieOk(false), 5_000)
    }, [jsonConfiguration, setCopieOk])

    if(!props.show) return ''

    return (
        <div>
            <pre>{jsonConfiguration}</pre>
            <p>
                <Button variant={copieOk?'success':'primary'} onClick={copierClipboard} disabled={!!copieOk}>
                    {copieOk?
                        <span>Copie OK<i className='fa fa-check'/></span>
                    :
                    'Copier'}
                </Button>
            </p>
        </div>
    )
}

function BluetoothSupporte(props) {
    const [devices, setDevices] = useState('')
    const [deviceSelectionne, setDeviceSelectionne] = useState('')
    const [bluetoothServer, setBluetoothServer] = useState('')

    const [ssid, setSsid] = useState('')
    const [wifiPassword, setWifiPassword] = useState('')
    const [relai, setRelai] = useState('')    

    const selectionnerDevice = useCallback(deviceId=>{
        console.debug("Selectioner device %s", deviceId)
        bluetooth.getDevices()
            .then(devices=>{
                for(const device of devices) {
                    if(device.id === deviceId) {
                        console.debug("Device trouve ", device)
                        setDeviceSelectionne(device)
                        return
                    }
                }
                console.error("Device Id %s inconnu", deviceId)
            })
            .catch(err=>console.error("Erreur getDevices", err))
    }, [setDeviceSelectionne])

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

    const fermerAppareilCb = useCallback(()=>{
        setDeviceSelectionne('')
        setBluetoothServer('')
    }, [setDeviceSelectionne, setBluetoothServer])

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
                }
            }                
        }
    }, [deviceSelectionne, setBluetoothServer])

    return (
        <div>
            <ValeursConfiguration 
                ssid={ssid}
                setSsid={setSsid}
                wifiPassword={wifiPassword}
                setWifiPassword={setWifiPassword}
                relai={relai}
                setRelai={setRelai} />

            <p>Les boutons suivants permettent de trouver un appareil avec la radio bluetooth.</p>
            <p>
                <Button variant="primary" onClick={scanCb}>Scan</Button>{' '}
                <Button variant="secondary" onClick={fermerAppareilCb} disabled={!deviceSelectionne}>Fermer</Button>
            </p>

            <ConfigurerAppareilSelectionne 
                deviceSelectionne={deviceSelectionne} 
                server={bluetoothServer} 
                ssid={ssid}
                wifiPassword={wifiPassword}
                relai={relai} />
        </div>
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

async function requestDevice() {
    let device = null
    const configurerUuid = millegrillesServicesConst.services.configurer.uuid,
          etatUuid  = millegrillesServicesConst.services.etat.uuid,
          environmentalUuid = 0x181a
    console.debug("Services %s, %s", configurerUuid, etatUuid)
    try {
        device = await bluetooth.requestDevice({
            // Requis : service de configuration
            // filters: [{services: [etatUuid]}],
            filters: [{services: [configurerUuid]}],
            // Optionnels - requis par Chrome sur Windows (permission d'acces)
            // optionalServices: [configurerUuid, environmentalUuid],
            optionalServices: [etatUuid, environmentalUuid],
        })
    } catch(err) {
        if(err.code === 8) {
            // Cancel
            return
        }
        // Reessayer sans optionalServices (pour navigateur bluefy)
        device = await bluetooth.requestDevice({
            // Requis : service de configuration
            filters: [{services: [configurerUuid, etatUuid]}],
        })
    }
    console.debug("Device choisi ", device)
    return device
}


function ConfigurerAppareilSelectionne(props) {
    const { deviceSelectionne, server, ssid, wifiPassword, relai } = props

    const [etatAppareil, setEtatAppareil] = useState('')

    const rafraichir = useCallback(()=>{
        if(!server.connected) {
            console.warn("Connexion bluetooth coupee")
        }
        chargerEtatAppareil(server)
            .then(etat=>{
                console.debug("Etat appareil %O", etat)
                setEtatAppareil(etat)
            })
            .catch(err=>console.debug("Erreur chargement etat appareil ", err))
    }, [server, setEtatAppareil])

    useEffect(()=>{
        if(server.connected) {
            rafraichir()
            const interval = setInterval(rafraichir, 7_500)
            return () => clearInterval(interval)
        }
    }, [server, rafraichir])

    if(!server) return ''

    return (
        <div>
            <hr />
            <h3>Configurer {deviceSelectionne.name}</h3>

            <EtatAppareil value={etatAppareil} />
            
            <SoumettreConfiguration 
                show={!!etatAppareil}
                server={server} 
                ssid={ssid}
                wifiPassword={wifiPassword}
                relai={relai} />
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

            <Row><Col xs={6} sm={4} md={3}>Ntp sync</Col><Col>{value.ntp?'Oui':'Non'}</Col></Row>
            <Row><Col xs={6} sm={4} md={3}>Heure</Col><Col><FormatterDate value={value.time}/></Col></Row>
        </div>
    )
}

async function chargerEtatAppareil(server) {
    try {
        if(!server.connected) {
            console.error("GATT connexion - echec")
            return
        }
        const service = await server.getPrimaryService(millegrillesServicesConst.services.etat.uuid)
        console.debug("Service : ", service)
        const characteristics = await service.getCharacteristics()
        const etat = await lireEtatCharacteristics(characteristics)

        return etat
    } catch(err) {
        console.error("Erreur chargerEtatAppareil %O", err)
    }
}

async function lireEtatCharacteristics(characteristics) {
    console.debug("Nombre characteristics : " + characteristics.length)
    const etat = {}
    for await(const characteristic of characteristics) {
        console.debug("Lire characteristic " + characteristic.uuid)
        const uuidLowercase = characteristic.uuid.toLowerCase()
        switch(uuidLowercase) {
            case millegrillesServicesConst.services.etat.characteristics.getUserId:
                etat.userId = await readTextValue(characteristic)
                break
            case millegrillesServicesConst.services.etat.characteristics.getIdmg:
                etat.idmg = await readTextValue(characteristic)
                break
            case millegrillesServicesConst.services.etat.characteristics.getWifi1:
                Object.assign(etat, await readWifi1(characteristic))
                break
            case millegrillesServicesConst.services.etat.characteristics.getWifi2:
                etat.ssid = await readTextValue(characteristic)
                break
            case millegrillesServicesConst.services.etat.characteristics.getTime:
                Object.assign(etat, await readTime(characteristic))
                break
            default:
                console.debug("Characteristic etat inconnue : " + characteristic.uuid)
        }
    }
    return etat
}

async function readTextValue(characteristic) {
    const value = await characteristic.readValue()
    return new TextDecoder().decode(value)
}

async function readTime(characteristic) {
    const value = await characteristic.readValue()
    console.debug("readTime value %O", value)
    const etatNtp = value.getUint8(0) === 1
    const timeSliceVal = new Uint32Array(value.buffer.slice(1, 5))
    console.debug("Time slice val ", timeSliceVal)
    const timeVal = timeSliceVal[0]
    const dateTime = new Date(timeVal * 1000)
    console.debug("Time val : %O, Date %O", timeVal, dateTime)
    return {ntp: etatNtp, time: timeVal}
}

function convertirBytesIp(adresse) {
    let adresseStr = adresse.join('.')
    return adresseStr
}

async function readWifi1(characteristic) {
    const value = await characteristic.readValue()
    console.debug("readWifi1 value %O", value)
    const connected = value.getUint8(0) === 1,
          status = value.getUint8(1),
          channel = value.getUint8(2)
    const adressesSlice = value.buffer.slice(3, 19)
    const adressesList = new Uint8Array(adressesSlice)
    const ip = convertirBytesIp(adressesList.slice(0, 4))
    const subnet = convertirBytesIp(adressesList.slice(4, 8))
    const gateway = convertirBytesIp(adressesList.slice(8, 12))
    const dns = convertirBytesIp(adressesList.slice(12, 16))

    const etatWifi = {
        connected,
        status,
        channel,
        ip, subnet, gateway, dns
    }

    return etatWifi
}

function ValeursConfiguration(props) {

    const { ssid, setSsid, wifiPassword, setWifiPassword, relai, setRelai } = props

    const usager = useUsager()
    const userId = usager.extensions.userId,
          idmg = usager.idmg


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

        const configurerUuid = millegrillesServicesConst.services.configurer.uuid,
              setConfigUuid = millegrillesServicesConst.services.configurer.characteristics.setConfig

        // Transmettre relai
        const cbRelai = async characteristic => {
            const params = {commande: 'setRelai', relai}
            await transmettreDict(characteristic, params)
        }
        const cbUser = async characteristic => {
            const params = {commande: 'setUser', idmg, user_id: userId}
            await transmettreDict(characteristic, params)
        }

        Promise.resolve()
            .then(async ()=>{
                await submitParamAppareil(server, configurerUuid, setConfigUuid, cbRelai)
                console.debug("Params relai envoyes")
                await submitParamAppareil(server, configurerUuid, setConfigUuid, cbUser)
                console.debug("Params user envoyes")
                messageSuccesCb('Les parametres serveur ont ete transmis correctement.')
            })
            .catch(err=>{
                console.error("Erreur sauvegarde parametres serveur", err)
                setMessageErreur({err, message: 'Les parametres serveur n\'ont pas ete recus par l\'appareil.'})
            })
    }, [server, idmg, userId, relai, messageSuccesCb, setMessageErreur])

    const submitWifi = useCallback(e=>{
        console.debug("Submit wifi ", e)
        e.stopPropagation()
        e.preventDefault()

        const cb = async characteristic => {
            const params = {commande: 'setWifi', ssid, password: wifiPassword}
            await transmettreDict(characteristic, params)
        }

        const configurerUuid = millegrillesServicesConst.services.configurer.uuid,
              setConfigUuid = millegrillesServicesConst.services.configurer.characteristics.setConfig

        submitParamAppareil(server, configurerUuid, setConfigUuid, cb).then(()=>{
            messageSuccesCb('Les parametres wifi ont ete transmis correctement.')
        })
        .catch(err=>{
            console.error("Erreur submit wifi ", err)
            setMessageErreur({err, message: 'Les parametres wifi n\'ont pas ete recus par l\'appareil.'})
        })

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

async function transmettreString(characteristic, valeur) {
    const CONST_FIN = new Uint8Array(1)
    CONST_FIN.set(0, 0x0)

    let valeurArray = new TextEncoder().encode(valeur)

    while(valeurArray.length > 0) {
        let valSlice = valeurArray.slice(0, 20)
        valeurArray = valeurArray.slice(20)
        await characteristic.writeValueWithResponse(valSlice)
    }

    // Envoyer char 0x0
    await characteristic.writeValueWithResponse(CONST_FIN)
}

async function transmettreDict(characteristic, valeur) {
    return transmettreString(characteristic, JSON.stringify(valeur))
}

async function submitParamAppareil(server, serviceUuid, characteristicUuid, callback) {
    if(!server) throw new Error("Server manquant")
    if(!serviceUuid) throw new Error('serviceUuid vide')
    if(!characteristicUuid) throw new Error('characteristicUuid vide')

    console.debug("submitParamAppareil serviceUuid %s, characteristicUuid %s", serviceUuid, characteristicUuid)

    try {
        if(!server.connected) {
            console.error("GATT connexion - echec")
            return
        }
        console.debug("GATT server ", server)
        const service = await server.getPrimaryService(serviceUuid)
        console.debug("GATT service ", service)
        const characteristics = await service.getCharacteristics()
        console.debug("GATT service characteristics ", characteristics)

        let traite = false
        for(const characteristic of characteristics) {
            const uuidLowercase = characteristic.uuid.toLowerCase()
            if(uuidLowercase === characteristicUuid) {
                await callback(characteristic)
                traite = true
                break
            }
        }

        if(!traite) {
            throw new Error(`characteristic ${characteristicUuid} inconnue pour service ${serviceUuid}`)
        }

    } catch(err) {
        console.error("Erreur chargerEtatAppareil %O", err)
    }
}
