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
import { SettingsPage } from './pages/SettingsPage';
import { getCurrentUser } from './repositories/user';
import { User } from './types';
import { LogoutPage } from './pages/LogoutPage';
import eventBus from './eventBus';
import { PullRequestPage } from './pages/PullRequestPage';

const App: React.FC = () => {

    const [currentUser, setCurrentUser] = useState<User|null>(null);

    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      console.log(user?.username)
      setCurrentUser(user);
    };

    const onUserChanged = () => {
      console.log('rec')
      loadCurrentUser();
    };

    useEffect( () => {
      loadCurrentUser()

        // TODO fix: call current instance of onUserChanged
      eventBus.on('user-changed', onUserChanged);
      return () => {
        console.error('rem')
        eventBus.remove('user-changed', onUserChanged);
      };
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
      <Route path="/pr" component={PullRequestPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/logout" component={LogoutPage} />
      <Route component={NotFoundPage} />
      </Switch>
    
      </div>
      </Router>
    );
 
}

export default App;