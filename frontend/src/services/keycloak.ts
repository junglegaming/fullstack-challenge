import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'crash-game',
  clientId: 'crash-game-client',
})

export default keycloak