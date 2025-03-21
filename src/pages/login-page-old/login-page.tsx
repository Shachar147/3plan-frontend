import React, { useContext, useState } from 'react';
import axios from 'axios';
import { setToken } from '../../helpers/auth';
import { Link, useNavigate } from 'react-router-dom';
import { apiPostWithCallback } from '../../helpers/api';
import { LOGIN_DELAY } from '../../utils/consts';
import './login-page.scss';
import { eventStoreContext } from '../../stores/events-store';
import TranslateService from '../../services/translate-service';
import { getClasses } from '../../utils/utils';
import TextInputWrapper from '../../components/inputs/text-input-wrapper/text-input-wrapper';

// @ts-ignore
import style from './style';
import { observer } from 'mobx-react';
import ReactModalService from '../../services/react-modal-service';
import DataServices from '../../services/data-handlers/data-handler-base';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';

const defaultErrorField: Record<string, boolean> = {
	username: false,
	password: false,
};
const errorTestId = 'error';
const messageTestId = 'message';
const Logo = () => (
	<img
		className={getClasses(['logo-container pointer'])}
		style={{ maxWidth: '400px' }}
		src={'/images/logo/new-logo.png'}
	/>
);

const LoginPageOld = () => {
	// define states
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [errorField, setErrorField] = useState(defaultErrorField);
	const [validating, setValidating] = useState(false);
	const [redirect, setRedirect] = useState(false);

	useHandleWindowResize();

	const eventStore = useContext(eventStoreContext);

	const login = () => {
		// if we're already trying to perform login, do not try again.
		if (validating) return;

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
			apiPostWithCallback(
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

	const onKeyDown = (keyCode: number) => {
		if (keyCode === 13) {
			login();
		}
	};

	// more settings
	const inputs = [
		{
			name: 'username',
			type: 'text',
			placeholder: TranslateService.translate(eventStore, 'USERNAME'),
			icon: 'user',
			value: username,
			setValue: setUsername,
			dataTestId: 'username',
		},
		{
			name: 'password',
			type: 'password',
			placeholder: TranslateService.translate(eventStore, 'PASSWORD'),
			icon: 'lock',
			value: password,
			setValue: setPassword,
			dataTestId: 'password',
		},
	];

	// building blocks
	const error_block =
		error === '' ? (
			''
		) : (
			<style.Error className="field" data-testid={errorTestId}>
				<div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, error) }} />
			</style.Error>
		);
	const message_block =
		message === '' || error !== '' ? (
			''
		) : (
			<style.Message className="field" data-testid={messageTestId}>
				<div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, message) }} />
			</style.Message>
		);

	if (redirect) {
		window.location.href = '/';
	}

	const headerProps = {
		withLogo: false,
		withSearch: false,
		withViewSelector: false,
		withMyTrips: false,
		withFilterTags: false,
		withLoginLogout: false,
	};

	const navigate = useNavigate();

	// @ts-ignore
	return (
		<div className="login-page">
			<TriplanHeaderWrapper {...headerProps} />
			<style.Container className="login-page-content ui header cards centered">
				<style.SubContainer>
					<div
						onClick={() => {
							navigate('/home');
						}}
					>
						<Logo />
					</div>
					<div className="login-form-container sub cards header content">
						<div className="ui segment">
							{message_block}
							{error_block}
							{inputs.map((input, idx) => {
								const { name, type, placeholder, icon, value, setValue, dataTestId } = input;
								return (
									<div key={`login-${name}-idx`}>
										<TextInputWrapper
											key={`login-${name}-idx`}
											name={name}
											icon={icon}
											type={type}
											disabled={validating}
											placeholder={placeholder}
											error={errorField[name]}
											value={value}
											onChange={(e: any) => {
												setValue(e.target.value);
												setErrorField({ ...errorField, [name]: false });
											}}
											onKeyDown={(e: any) => onKeyDown(e.keyCode)}
											dataTestId={dataTestId}
											autoComplete={'off'}
										/>
									</div>
								);
							})}
							<div className="flex-row gap-10">
								<style.Button
									validating={validating}
									className="ui fluid large button primary-button"
									data-testid={'submit'}
									onClick={login}
								>
									{TranslateService.translate(eventStore, 'LOGIN')}
								</style.Button>
								<style.Button
									validating={validating}
									className="ui fluid large button secondary-button black"
									data-testid={'guest'}
									onClick={() => {
										if (!DataServices.LocalStorageService.shouldShowContinueAsGuest()) {
											window.location.href = '/home';
										} else {
											ReactModalService.openConfirmModal(
												eventStore,
												() => {
													window.location.href = '/home';
												},
												'MODALS.ARE_YOU_SURE',
												'CONTINUE_AS_GUEST_MODAL_CONTENT',
												'CONTINUE_AS_GUEST'
											);
											DataServices.LocalStorageService.doNotShowContinueAsGuest();
										}
									}}
								>
									{TranslateService.translate(eventStore, 'CONTINUE_AS_GUEST')}
								</style.Button>
							</div>
						</div>
						<div className="register-link-container" key={'register-link-container'}>
							<style.RegisterLink>
								{TranslateService.translate(eventStore, 'REGISTER_PREFIX')}{' '}
								<Link data-testid={'register'} to={'/register'}>
									{TranslateService.translate(eventStore, 'REGISTER')}
								</Link>
							</style.RegisterLink>
						</div>
					</div>
				</style.SubContainer>
			</style.Container>
		</div>
	);
};
export default observer(LoginPageOld);
