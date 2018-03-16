import React from 'react';
import { Menu, Image, Button, Container } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import loginButton from '../../images/loginButton.png';
import logo from '../../images/logo.png';

const Navbar = ({isLoadingCharacter, isLoggedIn, user}) => {

    const onEVEAuthClick = () => {
        const authURL = '/auth/read/login';
        const windowName = 'EVE_SSO_login';
        const windowSpecs = 'width=400,height=500';
        window.open(authURL, windowName, windowSpecs);
    }

    const rightMenuItems = () => {
        if (!isLoadingCharacter && !isLoggedIn) {
            return (
                <Menu.Item position='right'>
                    <Button onClick={onEVEAuthClick}>
                        <Image
                            src={loginButton}
                            size='small'
                        />
                    </Button>
                </Menu.Item>
            )
        } else if (!isLoadingCharacter && isLoggedIn) {
            const imgSrc = `http://image.eveonline.com/Character/${user.characterID}_64.jpg`;
            return (
                <Menu.Item position='right'>
                    <Image 
                        src={imgSrc}
                        size='mini'
                        style={{ marginRight: '1.5em' }}
                    />
                    {user.characterName}
                    <Button
                        as='a'
                        href='/auth/logout'
                        style={{ marginLeft: '1.5em' }}
                    >
                        Logout
                    </Button>
                </Menu.Item>
            )
        }
    };

    return (
        <Container>
            <Menu fixed='top' inverted>
                <Menu.Item header>
                    <Image 
                        size='mini'
                        src={logo}
                        style={{ marginRight: '1.5em' }}
                    />
                    EVE Outpost
                </Menu.Item>
                <Menu.Item as={NavLink} to='/market'>MarketView</Menu.Item>
                <Menu.Item as={NavLink} to='/hubcompare'>ShoppingList</Menu.Item>
                <Menu.Item as={NavLink} to='/stock'>Stocker</Menu.Item>
                <Menu.Item as={NavLink} to='/orders'>Orders</Menu.Item>
                <Menu.Item as={NavLink} to='/blueprints'>Blueprints</Menu.Item>
                {rightMenuItems()}
            </Menu>
        </Container>
    )
};

export default Navbar;