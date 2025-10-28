import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './app/store';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'antd/dist/reset.css';

console.log(process.env.REACT_APP_GOOGLE_CLIENT_ID);

const GREYSCALE_STORAGE_KEY = 'ssc:appearance:grayscale';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    if (window.localStorage.getItem(GREYSCALE_STORAGE_KEY) === 'true') {
      document.documentElement.classList.add('grayscale-mode');
    }
  } catch (err) {
    // ignore storage issues
  }
}


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
