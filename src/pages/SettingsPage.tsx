import { useEffect, useState } from "react";
import { Container } from "../components/Container";
import eventBus from "../eventBus";
import { getCurrentUser, saveCurrentUser } from "../repositories/user";
import { User } from "../types";

export const SettingsPage: React.FC = () => {

  const [currentUser, setCurrentUser] = useState<User|null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const loadCurrentUser = async () => {
    getCurrentUser().then((user) => {
        setCurrentUser(user);
if (user){
setUsername(user.username);
setEmail(user.email);
}
    }, (error) => {
      console.error(error)
    });
  };

  useEffect( () => {
    loadCurrentUser()
  }, []);

  const save = async () => {
    const user = currentUser;
    if (!user) {
      return;
    }
    user.username = username;
    user.email = email;
//    setCurrentUser(user);
    await saveCurrentUser(user);
    // TODO somehow trigger the redraw of the App component?
    // maybe pass the component down here through the route?
    eventBus.dispatch('user-changed', user);
    console.log('DISPATCH');
    // TODO show toast that we saved successfully
  };



    // TODO maybe allow to refetch the avatar from GitHub?
    return (<Container>
        <h1 className="mt-4">Settings</h1>
            This username and email are used in the git commit if you submit a matching function.
  <div className="mb-3 mt-3">
    <label htmlFor="username">Username</label>
    <input type="username" className="form-control" id="username" placeholder="Enter username" 
    value={username} 
    onChange={(e) => {setUsername(e.target.value)}}
    />
  </div>
  <div className="mb-3">
    <label htmlFor="email">Email address</label>
    <input type="email" className="form-control" id="email" placeholder="Enter email"
    value={email}
    onChange={(e) => {setEmail(e.target.value)}}/>
  </div>
  <button type="submit" className="btn btn-primary" onClick={save}>Save</button>
    </Container>);
}