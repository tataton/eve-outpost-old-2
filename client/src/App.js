import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      listFactions: []
    }
    this.getFactions = this.getFactions.bind(this);
  }

  getFactions () {
    fetch('/api/factions')
    .then(response => response.json())
    .then(json => {
      this.setState(() => {return {listFactions: json.results}})
    })
    .catch((err) => {
      console.log("error", err);
    });
  }

  render() {
    const members = this.state.listFactions;
    return (
      <div className="App">
        <h1>Faction List</h1>
        <button onClick={this.getFactions}>Get Factions</button>
        <ul>
          {members.map(factionString => 
            <li key={factionString}>{factionString}</li>
          )}
        </ul>
      </div>
    );
  }
}

export default App;
