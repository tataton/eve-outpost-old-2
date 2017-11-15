import React from 'react';
import { render } from 'react-dom';
// import { BrowserRouter } from 'react-router-dom';
import App from './components/App';
import 'semantic-ui-css/semantic.min.css';

// import registerServiceWorker from './registerServiceWorker';

render((
    <App />
), document.getElementById('root'));

/*
render((
    <BrowserRouter>
        <App />
    </BrowserRouter>
), document.getElementById('root'));
*/

// registerServiceWorker();
