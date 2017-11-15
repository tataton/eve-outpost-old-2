import React from 'react';
import { Container } from 'semantic-ui-react';
import { Route, Switch } from 'react-router-dom';
import Home from '../Home';
import Market from '../Market';

const Main = ({loggedInCharacterName, loggedInCharacterID}) => {
    return (
        <Container style={{ marginTop: '6em' }}>
            <Switch>
                <Route exact path='/' component={Home}/>
                <Route path='/market' component={Market}/>
            </Switch>
        </Container>
    )
}

export default Main;