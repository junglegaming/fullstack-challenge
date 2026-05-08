import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import keycloak from './services/keycloak'
import './index.css'

keycloak
  .init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
  })
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <App />
    )
  })