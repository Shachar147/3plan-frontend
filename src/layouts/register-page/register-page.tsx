import React, { useContext, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import './register-page.scss';
import TranslateService from '../../services/translate-service';
import { eventStoreContext } from '../../stores/events-store';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';
import { getClasses } from '../../utils/utils';
import { Link, useNavigate } from 'react-router-dom';
import Button, { ButtonFlavor } from '../../components/common/button/button';
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

function RegisterPage() {
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();
	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const passwordAgainRef = useRef<HTMLInputElement>(null);
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
		<span className={'login-link-container'} key={'login-link-container'}>
			<div style={{ direction: eventStore.getCurrentDirection() }}>
				{TranslateService.translate(eventStore, 'LOGIN_PREFIX')}{' '}
				<Link data-testid={'login'} to={'/login'}>
					{TranslateService.translate(eventStore, 'LOGIN')}
				</Link>
			</div>
		</span>
	);

	const register = () => {
		// if we're already trying to perform login, do not try again.
		if (validating) return;

		const username = usernameRef.current?.value ?? '';
		const password = passwordRef.current?.value ?? '';
		const passwordAgain = passwordAgainRef.current?.value ?? '';

		// validate inputs
		if (username.length === 0) {
			setError('USERNAME_EMPTY');
			setErrorField({ ...errorField, username: true });
		} else if (password.length === 0 || passwordAgain.length == 0) {
			setError('PASSWORD_EMPTY');
			if (password.length === 0 && passwordAgain.length === 0) {
				setErrorField({ ...errorField, password: true, passwordAgain: true });
			} else if (password.length === 0) {
				setErrorField({ ...errorField, password: true });
			} else {
				setErrorField({ ...errorField, passwordAgain: true });
			}
		} else if (password !== passwordAgain) {
			setError('PASSWORDS_NOT_MATCH');
			setErrorField({ ...errorField, password: true, passwordAgain: true });
		} else {
			setErrorField(defaultErrorField);
			setValidating(true);

			apiPost(
				this,
				'/auth/signup',
				{
					username: username,
					password: password,
				},
				async function (res: any) {
					// console.log(res);
					if (res && res.error) {
						setError(res.error);
					} else {
						setMessage('REGISTERED_SUCCESSFULLY');
						setTimeout(
							function (self) {
								navigate('/login');
							},
							LOGIN_DELAY,
							self
						);
					}
				},
				function (err: any) {
					if (err.response && err.response.data && err.response.data.message) {
						const message = err.response.data.message;
						setError(typeof message === 'object' ? message.join('<br>') : message);

						console.log(err, message);

						if (err.response.data.statusCode && [404].indexOf(err.response.data.statusCode) !== -1) {
							setError('Network Error');
						}
					} else {
						setError('Network Error');
					}
				},
				function () {
					setValidating(false);
				}
			);
		}
	};

	const onKeyDown = (keyCode: number) => {
		if (keyCode === 13) {
			register();
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
		<div className="register-page">
			<div className={getClasses('change-language-bar', eventStore.isMobile && 'mobile')}>
				<TriplanHeaderWrapper {...headerProps} />
			</div>
			<div className="register-page-content">
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
					{renderField({
						name: 'passwordAgain',
						placeholder: TranslateService.translate(eventStore, 'REPEAT_PASSWORD'),
						type: 'password',
						icon: 'lock',
						ref: passwordAgainRef,
					})}
					<div className="login-form-buttons">
						<Button
							text={TranslateService.translate(eventStore, 'REGISTER_BUTTON')}
							onClick={register}
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

export default observer(RegisterPage);
