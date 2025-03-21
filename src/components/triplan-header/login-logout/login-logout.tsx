import Button, { ButtonFlavor } from '../../common/button/button';
import TranslateService from '../../../services/translate-service';
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { eventStoreContext } from '../../../stores/events-store';
import { getUser } from '../../../helpers/auth';
import { getClasses } from '../../../utils/utils';
// import '../../../stylesheets/app.scss';

interface LoginLogoutProps {
	isLoggedIn?: boolean;
}

function LoginLogout(props: LoginLogoutProps) {
	const eventStore = useContext(eventStoreContext);
	const isLoggedIn = props.isLoggedIn ?? !!getUser();

	function renderLogin() {
		return (
			<a href="/login" className="text-decoration-none">
				<Button
					flavor={ButtonFlavor.link}
					icon={getClasses('fa-sign-in darkest-blue-color', eventStore.isRtl && 'flip-x')}
					text={`${TranslateService.translate(eventStore, 'LOGIN')}`}
					onClick={() => {}}
				/>
			</a>
		);
	}

	function renderLogout() {
		return (
			<a href="/logout" className="text-decoration-none">
				<Button
					flavor={ButtonFlavor.link}
					icon={getClasses('fa-sign-in darkest-blue-color', !eventStore.isRtl && 'flip-x')}
					text={`${TranslateService.translate(eventStore, 'LOGOUT')}, ${getUser()}`}
					onClick={() => {}}
				/>
			</a>
		);
	}

	const component = isLoggedIn ? renderLogout() : renderLogin();
	return <div className={eventStore.isRtl ? 'rtl-direction' : 'flex-row'}>{component}</div>;
}

export default observer(LoginLogout);
