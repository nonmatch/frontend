import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import './userWorker';


ReactDOM.render(
    // React strict mode does not work with react-simple-resizer
    /*  <React.StrictMode>
      <App />
    </React.StrictMode>*/
    <App />,
    document.getElementById('root')
);