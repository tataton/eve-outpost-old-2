import React, { Component, Fragment } from 'react';
import Navbar from '../Navbar';
import StationChooser from '../StationChooser';
import Main from '../Main';

class App extends Component {
  
  constructor(props) {
    super(props);
    this.initialCharacter = {
      characterName: '',
      characterID: 0,
      accessType: null,
      currentLocation: null
    }
    this.state = {
      isLoadingCharacter: true,
      isLoggedIn: false,
      user: this.initialCharacter
    };
    this.logOutCharacter = this.logOutCharacter.bind(this);
    this.logInCharacter = this.logInCharacter.bind(this);
  }

  logOutCharacter() {
    this.setState((state) => ({
      isLoadingCharacter: false,
      isLoggedIn: false,
      user: this.initialCharacter
    }));
  }

  logInCharacter({characterID, characterName, accessType}) {
    this.setState((state) => ({
      isLoadingCharacter: false,
      isLoggedIn: true,
      user: {
        characterName,
        characterID,
        accessType
      }
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
      <Fragment>
        <Navbar
          isLoadingCharacter={this.state.isLoadingCharacter}
          isLoggedIn={this.state.isLoggedIn}
          user={this.state.user}
        />
        <StationChooser
          chosenLocation={this.state.user.chosenLocation}
        />
        <Main
          isLoggedIn={this.state.isLoggedIn}
          user={this.state.user}
        />
      </Fragment>
    );
  }
}

export default App;