import React, { Component } from 'react';
import Aux from 'react-aux';
import FixedMenu from '../FixedMenu';
import Main from '../Main';

class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      isLoadingCharacter: true,
      isLoggedIn: false,
      loggedInCharacterName: '',
      loggedInCharacterID: 0
    };
    this.logOutCharacter = this.logOutCharacter.bind(this);
    this.logInCharacter = this.logInCharacter.bind(this);
  }

  logOutCharacter() {
    this.setState((state) => ({
      isLoadingCharacter: false,
      isLoggedIn: false,
      loggedInCharacterName: '',
      loggedInCharacterID: 0
    }));
  }

  logInCharacter({characterID, characterName}) {
    this.setState((state) => ({
      isLoadingCharacter: false,
      isLoggedIn: true,
      loggedInCharacterName: characterName,
      loggedInCharacterID: characterID
    }));
  }

  componentDidMount() {
    fetch('/auth/getuserinfo', {credentials: 'include'})
      .then(response => response.json())
      .then(result => {
        this.logInCharacter(result);
      })
      .catch(() => {this.logOutCharacter()})
  }

  render() {
    return (
      <Aux>
        <FixedMenu
          isLoadingCharacter={this.state.isLoadingCharacter}
          isLoggedIn={this.state.isLoggedIn}
          loggedInCharacterName={this.state.loggedInCharacterName}
          loggedInCharacterID={this.state.loggedInCharacterID}
        />
        <Main
          loggedInCharacterName={this.state.loggedInCharacterName}
          loggedInCharacterID={this.state.loggedInCharacterID}
        />
      </Aux>
    );
  }
}

export default App;