import React, { useEffect, useState } from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import './App.css'
import EditorPage from './pages/EditorPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Navbar } from './components/Navbar';
import { API_URL } from './constants';
import { get } from './api';
import { FunctionsPage } from './pages/FunctionsPage';
import { FunctionPage } from './pages/FunctionPage';

const App: React.FC = () => {

    const [currentUser, setCurrentUser] = useState(null);

    console.log(window.location.search);

    const loadCurrentUser = async () => {
      const data = await get(API_URL + 'user');
      if (data['error'] !== undefined) {
        console.log('not logged in ', data['error']);
        setCurrentUser(null);
      }else {
        console.log(data);
        setCurrentUser(data);
      }
    };

    useEffect( () => {
      loadCurrentUser()
    }, []);

    return (

      <Router><div 
      className="App" style={{
        display: "flex",
        flexDirection: "column"
      }}>
        <Navbar currentUser={currentUser} />

      <Switch>
      <Route path="/" exact component={FunctionsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/functions/:function/submissions/:submission" component={EditorPage} />
      <Route path="/functions/:function" component={FunctionPage} />
      <Route component={NotFoundPage} />
      </Switch>
    
      </div>
      </Router>
    );
 
}

export default App;