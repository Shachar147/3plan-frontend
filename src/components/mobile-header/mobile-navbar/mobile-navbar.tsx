import React, { useContext, useEffect, useMemo } from 'react';

// ROUTING
import { Link, useNavigate } from 'react-router-dom';

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
import useIsAdmin from '../../../custom-hooks/use-is-admin';

const MobileNavbar = (options: TriplanHeaderProps) => {
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();

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

	const isAdmin = useIsAdmin();

	const toggleSearch = () => {
		const isOpen = !eventStore.isSearchOpen;
		runInAction(() => {
			eventStore.setIsSearchOpen(isOpen);
			eventStore.didChangeSearchOpenState = true;
			if (!isOpen) {
				eventStore.setSearchValue('');
			}
		});
	};

	function renderSwitchToAdmin(isAdmin: boolean) {
		const isOnAdminPanel = window.location.href.indexOf('/admin') !== -1;
		const isOnLoginPage = window.location.href.indexOf('/login') !== -1;

		if (!isAdmin) {
			// alert('here not admin');
			return null;
		}
		if (isOnLoginPage) {
			// alert('here, on login page');
			return null;
		}
		if (!isOnAdminPanel) {
			return {
				title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.ADMIN_SIDE'),
				onClick: () => {
					navigate('/admin');
				},
				icon: 'fa-star',
				cName: getClasses('nav-text', isOnAdminPanel && 'active'),
			};
		}

		return {
			title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.USER_SIDE'),
			onClick: () => {
				navigate('/');
			},
			icon: 'fa-user',
			cName: getClasses('nav-text', !isOnAdminPanel && 'active'),
		};
	}

	const SidebarData: any[] = useMemo(() => {
		// alert('here' + isAdmin);
		return [
			withSearch && {
				title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.SEARCH'),
				onClick: () => {
					toggleSearch();
				},
				icon: 'fa-search',
				// @ts-ignore
				cName: getClasses('nav-text', (options.isSearchOpen || eventStore.isSearchOpen) && 'active'),
			},
			withMyTrips && eventStore.tripId && {
				title: TranslateService.translate(eventStore, 'SWITCH_TRIPS'),
				onClick: () => {
					ReactModalService.openSwitchTripsModal(eventStore);
				},
				icon: 'fa-reply-all',
				cName: 'nav-text'
			},
			withMyTrips && {
				title: TranslateService.translate(eventStore, 'LANDING_PAGE.MY_TRIPS'),
				path: '/my-trips',
				icon: 'fa-street-view',
				cName: getClasses('nav-text', window.location.href.indexOf('/my-trips') !== -1 && 'active'),
			},
			withLanguageSelector && {
				title: TranslateService.translate(eventStore, 'MOBILE_NAVBAR.CHANGE_LANGUAGE'),
				onClick: () => {
					ReactModalService.openChangeLanguageModal(eventStore);
				},
				icon: 'fa-globe',
				cName: getClasses('nav-text', window.location.href.indexOf('/language') !== -1 && 'active'),
			},
			renderSwitchToAdmin(isAdmin),
		].filter(Boolean);
	}, [isAdmin, eventStore.isSearchOpen]);

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
					<div className="mobile-navbar flex-row gap-10 align-items-center justify-content-center">
						{/*{withSearch && (*/}
						{/*	<i*/}
						{/*		className={getClasses('fa fa-search', eventStore.isSearchOpen && 'blue-color')}*/}
						{/*		onClick={() => toggleSearch()}*/}
						{/*	/>*/}
						{/*)}*/}

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
