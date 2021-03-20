import { openDB } from 'idb'
import stringify from 'json-stable-stringify'

import { MilleGrillesCryptoHelper, CryptageAsymetrique, genererAleatoireBase64, str2ab } from '@dugrema/millegrilles.common/lib/cryptoSubtle'

export async function signerChallenge(usager, challengeJson) {

  const contenuString = stringify(challengeJson)

  const nomDB = 'millegrilles.' + usager
  const db = await openDB(nomDB)
  const tx = await db.transaction('cles', 'readonly')
  const store = tx.objectStore('cles')
  const cleSignature = (await store.get('signer'))
  await tx.done

  const signature = await new CryptageAsymetrique().signerContenuString(cleSignature, contenuString)

  return signature
}

export async function dechiffrerCle(cleChiffree, clePrivee) {
  const cleDechiffree = await new CryptageAsymetrique().decrypterCleSecrete(cleChiffree, clePrivee)
  return cleDechiffree
}

export async function decrypterContenu(arrayBuffer, cleSecreteCryptee, iv, clePrivee) {
  console.debug("Decrypter cle secrete :%O\n, iv: %O\n, cle privee: %O",
    cleSecreteCryptee, iv, clePrivee)
    if(!iv || !clePrivee) {
      throw new Error("Cle ou IV non recu pour le fichier")
    }
  const helper = new MilleGrillesCryptoHelper()
  return await helper.decrypterSubtle(arrayBuffer, cleSecreteCryptee, iv, clePrivee)
}

// Initialiser le contenu du navigateur
export async function getCertificats(nomUsager, opts) {
  if(!opts) opts = {}

  const nomDB = 'millegrilles.' + nomUsager
  const db = await openDB(nomDB, 1, {
    upgrade(db) {
      db.createObjectStore('cles')
    },
  })

  // console.debug("Database %O", db)
  const tx = await db.transaction('cles', 'readonly')
  const store = tx.objectStore('cles')
  const certificat = (await store.get('certificat'))
  const fullchain = (await store.get('fullchain'))
  await tx.done

  return {certificat, fullchain}
}

// Initialiser le contenu du navigateur
export async function getClesPrivees(nomUsager) {

  const nomDB = 'millegrilles.' + nomUsager
  const db = await openDB(nomDB, 1, {
    upgrade(db) {
      db.createObjectStore('cles')
    },
  })

  // console.debug("Database %O", db)
  const tx = await db.transaction('cles', 'readonly')
  const store = tx.objectStore('cles')
  const dechiffrer = (await store.get('dechiffrer'))
  const signer = (await store.get('signer'))
  await tx.done

  return {dechiffrer, signer}
}
