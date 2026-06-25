import Keycloak from "keycloak-js";
import { keycloakConfig } from "../config";

export const keycloak = new Keycloak({
  url: keycloakConfig.url,
  realm: keycloakConfig.realm,
  clientId: keycloakConfig.clientId,
});
