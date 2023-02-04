import React, { useContext, useState } from 'react';

// ROUTING
import { Link } from 'react-router-dom';

// STYLES
import './mobile-navbar.scss';
import HamburgerIcon from '../triplan-header/mobile-menu/hamburger-icon/hamburger-icon';
import TranslateService from '../../services/translate-service';
import { eventStoreContext } from '../../stores/events-store';
import { getUser } from '../../helpers/auth';
import { getClasses } from '../../utils/utils';

export default function MobileNavbar() {
	const [sidebar, setSidebar] = useState(false);

	const eventStore = useContext(eventStoreContext);

	const isLoggedIn = !!getUser();
	const loginText = TranslateService.translate(eventStore, 'LOGIN');
	const logoutText = `${TranslateService.translate(eventStore, 'LOGOUT')}, ${getUser()}`;

	const SidebarData: any[] = [
		{
			title: isLoggedIn ? logoutText : loginText,
			path: isLoggedIn ? '/logout' : '/login',
			// icon: <AiIcons.AiFillHome />,
			icon: isLoggedIn ? 'fa-sign-out' : 'fa-sign-in',
			cName: 'nav-text',
		},
		{
			title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH'),
			path: '/search',
			icon: 'fa-search',
			// icon: <IoIcons.IoIosPaper />,
			cName: 'nav-text',
		},
		{
			title: TranslateService.translate(eventStore, 'CHOOSE_LANGUAGE'),
			path: '/language',
			icon: 'fa-globe',
			cName: 'nav-text',
		},
	];

	const showSidebar = () => setSidebar(!sidebar);

	return (
		<>
			{/* All the icons now are white */}
			<div className="mobile-navbar">
				<Link to="#" className="menu-bars">
					<HamburgerIcon className={'black-background'} onClick={showSidebar} />
				</Link>
			</div>
			<nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
				<ul className="nav-menu-items" onClick={showSidebar}>
					<li className="navbar-toggle">
						<Link to="#" className="menu-bars">
							<HamburgerIcon className={'black-background'} onClick={showSidebar} isOpen={true} />
						</Link>
					</li>

					{SidebarData.map((item, index) => {
						return (
							<li key={index} className={item.cName}>
								<Link to={item.path}>
									{item.icon && <i className={getClasses('fa', item.icon)} />}
									<span>{item.title}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</>
	);
}
