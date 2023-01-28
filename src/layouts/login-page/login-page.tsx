import React, { useContext, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import './login-page.scss';
import TranslateService from '../../services/translate-service';
import { eventStoreContext } from '../../stores/events-store';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';
import { getClasses } from '../../utils/utils';
import { Link, useNavigate } from 'react-router-dom';
import Button, { ButtonFlavor } from '../../components/common/button/button';
import DataServices from '../../services/data-handlers/data-handler-base';
import ReactModalService from '../../services/react-modal-service';
import { setToken } from '../../helpers/auth';
import axios from 'axios';
import { LOGIN_DELAY } from '../../utils/consts';
import { apiPost } from '../../helpers/api';

const defaultErrorField: Record<string, boolean> = {
	username: false,
	password: false,
};

const headerProps = {
	withLogo: false,
	withSearch: false,
	withViewSelector: false,
	withMyTrips: false,
	withFilterTags: false,
	withLoginLogout: false,
};

const errorTestId = 'error';
const messageTestId = 'message';

function LoginPage() {
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();
	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const [validating, setValidating] = useState(false);
	const [errorField, setErrorField] = useState(defaultErrorField);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [redirect, setRedirect] = useState(false);

	useHandleWindowResize();

	const TriplanLogo = ({ onClick }: { onClick?: () => void }) => (
		<img
			className={getClasses('logo-container', !eventStore.isMobile && 'pointer')}
			src={'/images/logo/new-logo.png'}
			onClick={onClick}
		/>
	);

	const FooterLinkBlock = () => (
		<span className={'register-link-container'} key={'register-link-container'}>
			<div style={{ direction: eventStore.getCurrentDirection() }}>
				{TranslateService.translate(eventStore, 'REGISTER_PREFIX')}{' '}
				<Link data-testid={'register'} to={'/register'}>
					{TranslateService.translate(eventStore, 'REGISTER')}
				</Link>
			</div>
		</span>
	);

	const onKeyDown = (keyCode: number) => {
		if (keyCode === 13) {
			login();
		}
	};

	const login = () => {
		// if we're already trying to perform login, do not try again.
		if (validating) return;

		const username = usernameRef.current?.value ?? '';
		const password = passwordRef.current?.value ?? '';

		// validate inputs
		if (username.length === 0) {
			setError('USERNAME_EMPTY');
			setErrorField({ ...errorField, username: true });
		} else if (password.length === 0) {
			setError('PASSWORD_EMPTY');
			setErrorField({ ...errorField, password: true });
		} else {
			setErrorField(defaultErrorField);
			setValidating(true);

			// trying to login and get a token.
			apiPost(
				this,
				'/auth/signin',
				{
					username: username,
					password: password,
				},
				// success block
				async function (res: any) {
					if (res && res.data && res.data.accessToken) {
						// keep token
						const token = res.data.accessToken;
						setToken(token);
						axios.defaults.headers.Authorization = `Bearer ${token}`;

						// set success message and redirect flag.
						setMessage('LOGGED_IN_SUCCESSFULLY');
						setTimeout(function () {
							setRedirect(true);
						}, LOGIN_DELAY);
					} else {
						setError('Oops, something went wrong');
					}
				},
				// catch block
				function (err: any) {
					let req_error = err?.response?.data?.message;
					if (req_error) setError('LOGIN_PAGE.WRONG_CREDENTIALS');
					else setError('Network Error');
				},
				// finally
				function () {
					setValidating(false);
				}
			);
		}
	};

	const continueAsGuest = () => {
		if (!DataServices.LocalStorageService.shouldShowContinueAsGuest()) {
			window.location.href = '/home';
			// navigate('/home');
		} else {
			ReactModalService.openConfirmModal(
				eventStore,
				() => {
					if (!eventStore.isMobile) {
						window.location.href = '/home';
						// navigate('/home');
					}
				},
				'MODALS.ARE_YOU_SURE',
				'CONTINUE_AS_GUEST_MODAL_CONTENT',
				'CONTINUE_AS_GUEST'
			);
			DataServices.LocalStorageService.doNotShowContinueAsGuest();
		}
	};

	function renderField({ name, placeholder, icon, type = 'text', ref }: any) {
		return (
			<div className="field">
				<i className={getClasses(icon, 'icon')}></i>
				<input
					name={name}
					className="textInput"
					type={type}
					placeholder={placeholder}
					autoComplete="off"
					data-testid="username"
					ref={ref}
					onKeyDown={(e: any) => onKeyDown(e.keyCode)}
					disabled={validating}
				/>
			</div>
		);
	}

	// building blocks
	const error_block =
		error === '' ? (
			''
		) : (
			<div className={'field red'} data-testid={errorTestId}>
				<div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, error) }} />
			</div>
		);
	const message_block =
		message === '' || error !== '' ? (
			''
		) : (
			<div className={'field blue'} data-testid={messageTestId}>
				<div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, message) }} />
			</div>
		);

	if (redirect) {
		window.location.href = '/';
		// navigate('/');
	}

	return (
		<div className="login-page">
			<div className={getClasses('change-language-bar', eventStore.isMobile && 'mobile')}>
				<TriplanHeaderWrapper {...headerProps} />
			</div>
			<div className="login-page-content">
				<TriplanLogo onClick={() => !eventStore.isMobile && navigate('/home')} />
				<div className="login-form">
					{message_block}
					{error_block}
					{renderField({
						name: 'username',
						placeholder: TranslateService.translate(eventStore, 'USERNAME'),
						icon: 'user',
						ref: usernameRef,
					})}
					{renderField({
						name: 'password',
						placeholder: TranslateService.translate(eventStore, 'PASSWORD'),
						type: 'password',
						icon: 'lock',
						ref: passwordRef,
					})}
					<div className="login-form-buttons">
						<Button
							text={TranslateService.translate(eventStore, 'CONTINUE_AS_GUEST')}
							onClick={continueAsGuest}
							flavor={ButtonFlavor.secondary}
							disabled={validating}
							disabledReason={TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING')}
							className="black"
						/>
						<Button
							text={TranslateService.translate(eventStore, 'LOGIN')}
							onClick={login}
							flavor={ButtonFlavor.primary}
							disabled={validating}
							disabledReason={TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING')}
						/>
					</div>
				</div>
				<FooterLinkBlock />
			</div>
		</div>
	);
}

export default observer(LoginPage);
