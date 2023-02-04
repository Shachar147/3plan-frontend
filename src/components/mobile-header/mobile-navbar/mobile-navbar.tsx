import React, { useContext, useEffect } from 'react';

// ROUTING
import { Link } from 'react-router-dom';

// STYLES
import './mobile-navbar.scss';
import HamburgerIcon from '../../triplan-header/mobile-menu/hamburger-icon/hamburger-icon';
import TranslateService from '../../../services/translate-service';
import { eventStoreContext } from '../../../stores/events-store';
import { getUser } from '../../../helpers/auth';
import { getClasses } from '../../../utils/utils';
import { observer, Observer } from 'mobx-react';
import { TriplanHeaderProps } from '../../triplan-header/triplan-header';
import onClickOutside from 'react-onclickoutside';

const MobileNavbar = (options: TriplanHeaderProps) => {
	const eventStore = useContext(eventStoreContext);

	// There are no instances, only the single Menu function, so if we
	// need "properties" that are externally accessible, we'll need to
	// set them on the Menu function itself:
	// @ts-ignore
	MobileNavbar.handleClickOutside = () => handleClickOutside();

	const {
		withMyTrips = true,
		withSearch = false,
		withFilterTags = false, // todo complete! think how to display filters in the mobile view
		withLoginLogout = true,
		withLanguageSelector = true,
	} = options;

	const isLoggedIn = !!getUser();
	const loginText = TranslateService.translate(eventStore, 'LOGIN');
	const logoutText = `${TranslateService.translate(eventStore, 'LOGOUT')}, ${getUser()}`;

	const SidebarData: any[] = [
		withLoginLogout && {
			title: isLoggedIn ? logoutText : loginText,
			path: isLoggedIn ? '/logout' : '/login',
			icon: isLoggedIn ? 'fa-sign-out' : 'fa-sign-in',
			cName: 'nav-text',
		},
		withSearch && {
			title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH'),
			onClick: () => {
				eventStore.setIsSearchOpen(!eventStore.isSearchOpen);
			},
			icon: 'fa-search',
			cName: getClasses('nav-text', eventStore.isSearchOpen && 'active'),
		},
		withMyTrips && {
			title: TranslateService.translate(eventStore, 'LANDING_PAGE.MY_TRIPS'),
			path: '/my-trips',
			icon: 'fa-street-view',
			cName: getClasses('nav-text', window.location.href.indexOf('/my-trips') !== -1 && 'active'),
		},
		withLanguageSelector && {
			title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.CHANGE_LANGUAGE'),
			path: '/language',
			icon: 'fa-globe',
			cName: getClasses('nav-text', window.location.href.indexOf('/language') !== -1 && 'active'),
		},
	].filter(Boolean);

	if (SidebarData.length === 0) return;

	function handleClickOutside() {
		eventStore.setIsMenuOpen(false);
	}

	return (
		<Observer>
			{() => (
				<>
					{/* All the icons now are white */}
					<div className="mobile-navbar">
						<Link to="#" className="menu-bars">
							<HamburgerIcon className={'black-background'} />
						</Link>
					</div>
					<nav className={eventStore.isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
						<ul className="nav-menu-items">
							<li className="navbar-toggle">
								<Link to="#" className="menu-bars">
									<HamburgerIcon className={'black-background'} isOpen={true} />
								</Link>
							</li>

							{SidebarData.map((item, index) => {
								const content = (
									<>
										{item.icon && <i className={getClasses('fa', item.icon)} />}
										<span>{item.title}</span>
									</>
								);
								return (
									<li
										key={index}
										className={item.cName}
										onClick={() => {
											eventStore.setIsMenuOpen(false);
										}}
									>
										{item.path ? (
											<Link to={item.path}>{content}</Link>
										) : (
											<a onClick={item.onClick}>{content}</a>
										)}
									</li>
								);
							})}
						</ul>
					</nav>
				</>
			)}
		</Observer>
	);
};

var clickOutsideConfig = {
	handleClickOutside: function (instance: any) {
		// There aren't any "instances" when dealing with functional
		// components, so we ignore the instance parameter entirely,
		//  and just return the handler that we set up for Menu:

		// @ts-ignore
		return MobileNavbar.handleClickOutside;
	},
};

export default onClickOutside(MobileNavbar, clickOutsideConfig);
