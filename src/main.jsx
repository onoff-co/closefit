import React from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter} from 'react-router';
import App from './App.jsx';
import {StoreProvider} from './state/StoreContext.jsx';
import './styles/store-base.css';
import './styles/store-pages.css';
import './styles/shopping-flow.css';
createRoot(document.getElementById('root')).render(
 <React.StrictMode><HashRouter><StoreProvider><App/></StoreProvider></HashRouter></React.StrictMode>
);
