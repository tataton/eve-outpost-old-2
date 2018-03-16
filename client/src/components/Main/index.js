import React from 'react';
import { Container } from 'semantic-ui-react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Market from '../Market';
import NeedsWriteAccess from '../NeedsWriteAccess';
import NeedsToLogIn from '../NeedsToLogIn';
import Hubcompare from '../Hubcompare';
import Stock from '../Stock';
import Orders from '../Orders';
import Blueprints from '../Blueprints';
import Welcome from '../Welcome';

const Main = ({isLoggedIn, user}) => {

    const requiresWriteAccess = (Component) => {
        return (isLoggedIn && user.accessType === 'write') ? (<Component />)
        : isLoggedIn ? (<NeedsWriteAccess />)
        : (<NeedsToLogIn/>)
    }

    return (
        <Container style={{ marginTop: '6em' }}>
            <Switch>
                <Route path='/market'
                    render={props =>
                        (<Market />)
                    }
                />
                <Route path='/hubcompare'
                    render={props =>
                        (<Hubcompare />)
                    }
                />
                <Route path='/stock'
                    render={props =>
                        requiresWriteAccess(Stock)
                    }
                    />
                <Route path='/orders'
                    render={props =>
                        requiresWriteAccess(Orders)
                    }
                />
                <Route path='/blueprints'
                    render={props =>
                        requiresWriteAccess(Blueprints)
                    }
                />
                <Route exact path='/'
                    render={props =>
                        (<Welcome />)
                    }
                />
                <Route path='/'
                    render={props =>
                        (<Redirect to='/'/>)
                    }
                />
            </Switch>
        </Container>
    )
}

export default Main;