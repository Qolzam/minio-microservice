// Copyright (c) 2021 Amirhossein Movahedi (@qolzam)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const cookie =  require('cookie-parse')
const jwt =  require('jsonwebtoken')
const { coreConfig } = require('./config')


/**
 * Get token from cookie
 */
const getTokenFromCookie = (rawCookie) => {
  const cookies = cookie.parse(rawCookie)
  console.log('[INFO] Received cookie ', cookies)
  if (!cookies.he) {
    throw new Error('Cookie header is not appeared!')
  }
  if (!cookies.pa) {
    throw new Error('Cookie payload is not appeared!')
  }
  if (!cookies.si) {
    throw new Error('Cookie sign is not appeared!')
  }

  const token = `${cookies.he}.${cookies.pa}.${cookies.si}`
  return token
}

/**
 * Verify JWT from cookei
 */
const verifyJWTFromCookei = (rawCookie) => {
    console.log('[INFO] Input verifyJWTFromCookei cookie to parse ', rawCookie)
  
    const token = getTokenFromCookie(rawCookie)
  
    // create a buffer
    const buff = Buffer.from(coreConfig.publicKey, 'base64')
  
    // decode buffer as UTF-8
    const cert = buff.toString('utf-8')
  
    const verifiedToken = jwt.verify(token, cert, { algorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'] })
    console.log('[INFO] ', 'verifiedToken ', verifiedToken)
    return verifiedToken
  }
  
  module.exports.verifyJWTFromCookei = verifyJWTFromCookei

