import React, { useContext, useEffect, useMemo } from 'react';

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
import ReactModalService from '../../../services/react-modal-service';
import { runInAction } from 'mobx';

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

	const SidebarData: any[] = useMemo(
		() =>
			[
				withSearch && {
					title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH'),
					onClick: () => {
						const isOpen = !eventStore.isSearchOpen;
						runInAction(() => {
							eventStore.setIsSearchOpen(isOpen);
							eventStore.didChangeSearchOpenState = true;
							if (!isOpen) {
								eventStore.setSearchValue('');
							}
						});
					},
					icon: 'fa-search',
					// @ts-ignore
					cName: getClasses('nav-text', options.isSearchOpen && 'active'),
				},
				withMyTrips && {
					title: TranslateService.translate(eventStore, 'LANDING_PAGE.MY_TRIPS'),
					path: '/my-trips',
					icon: 'fa-street-view',
					cName: getClasses('nav-text', window.location.href.indexOf('/my-trips') !== -1 && 'active'),
				},
				withLanguageSelector && {
					title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.CHANGE_LANGUAGE'),
					// path: '/language',
					onClick: () => {
						ReactModalService.openChangeLanguage(eventStore);
					},
					icon: 'fa-globe',
					cName: getClasses('nav-text', window.location.href.indexOf('/language') !== -1 && 'active'),
				},
			].filter(Boolean),
		[eventStore.isSearchOpen, withSearch]
	);

	const logoutLink = withLoginLogout && {
		title: isLoggedIn ? logoutText : loginText,
		path: isLoggedIn ? '/logout' : '/login',
		icon: isLoggedIn ? 'fa-sign-out' : 'fa-sign-in flip-x',
		cName: 'nav-text logout-link',
	};

	if (SidebarData.length === 0 && !logoutLink) return;

	function handleClickOutside() {
		setTimeout(() => {
			eventStore.setIsMenuOpen(false);
		}, 100);
	}

	function renderItem(item: any, index: number) {
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
					setTimeout(() => {
						eventStore.setIsMenuOpen(false);
					}, 500);
				}}
			>
				{item.path ? <Link to={item.path}>{content}</Link> : <a onClick={item.onClick}>{content}</a>}
			</li>
		);
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

							<div className="menu-items-links-container">
								<div className="menu-regular-items">
									{SidebarData.map((item, index) => renderItem(item, index))}
									{renderItem(logoutLink, SidebarData.length)}
								</div>
								{/*<div className="menu-logout-item">*/}
								{/*	{logoutLink && renderItem(logoutLink, SidebarData.length)}*/}
								{/*</div>*/}
							</div>
						</ul>
					</nav>
					{eventStore.isMenuOpen && <div className="background-overlay" />}
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

export default observer(onClickOutside(MobileNavbar, clickOutsideConfig));
