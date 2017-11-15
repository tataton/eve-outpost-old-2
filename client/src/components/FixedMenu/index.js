import React from 'react';
import { Menu, Image, Button, Container } from 'semantic-ui-react';
// import { NavLink } from 'react-router-dom';
import loginButton from '../../images/loginButton.png';
import logo from '../../images/logo.png';

const FixedMenu = ({isLoadingCharacter, isLoggedIn, loggedInCharacterName, loggedInCharacterID}) => {

    const rightMenuItems = () => {
        if (!isLoadingCharacter && !isLoggedIn) {
            return (
                <Menu.Item position='right'>
                    <Image
                        src={loginButton}
                        size='small'
                        as='a'
                        href='/auth/read/login'
                    />
                </Menu.Item>
            )
        } else if (!isLoadingCharacter && isLoggedIn) {
            const imgSrc = `http://image.eveonline.com/Character/${loggedInCharacterID}_64.jpg`;
            return (
                <Menu.Item position='right'>
                    <Image 
                        src={imgSrc}
                        size='mini'
                        style={{ marginRight: '1.5em' }}
                    />
                    {loggedInCharacterName}
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
                <Menu.Item as='a' href='/'>Home</Menu.Item>
                <Menu.Item as='a' href='/market'>Market Viewer</Menu.Item>
                {rightMenuItems()}
            </Menu>
        </Container>
    )

/*
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
                <Menu.Item as={NavLink} exact to='/'>Home</Menu.Item>
                <Menu.Item as={NavLink} to='/market'>Market Viewer</Menu.Item>
                {rightMenuItems()}
            </Menu>
        </Container>
    )
*/

};

export default FixedMenu;