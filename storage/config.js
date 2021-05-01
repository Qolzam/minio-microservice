// Copyright (c) 2021 Amirhossein Movahedi (@qolzam)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT


  // Core config
  module.exports.coreConfig = {
    gateway: process.env.gateway,
    publicKey: process.env.key_pub,
    origin: process.env.origin,
  }



  // Storage config
  const storageConfig = {
    baseRoute: process.env.base_route,
    authMethod: process.env.auth_method
  }

  console.log('[INFO] storageConfig', storageConfig)
  module.exports.storageConfig = storageConfig

