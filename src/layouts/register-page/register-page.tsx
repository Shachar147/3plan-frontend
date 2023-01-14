import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { apiPost } from '../../helpers/api';
import TextInputWrapper from '../../components/inputs/text-input-wrapper/text-input-wrapper';
import { LOGIN_DELAY } from '../../utils/consts';
import './register-page.scss';

// @ts-ignore
import style from './style';
import { getClasses } from '../../utils/utils';
import TranslateService from '../../services/translate-service';
import { eventStoreContext } from '../../stores/events-store';
import { observer } from 'mobx-react';
import TriplanHeaderWrapper from '../../components/triplan-header/triplan-header-wrapper';
import { useHandleWindowResize } from '../../custom-hooks/use-window-size';

const Logo = () => (
	<img
		className={getClasses(['logo-container pointer'])}
		style={{ maxWidth: '400px' }}
		src={'/images/logo/new-logo.png'}
	/>
);

// define defaults
export const defaultErrorField: Record<string, boolean> = {
	username: false,
	password: false,
	passwordAgain: false,
};
export const errorTestId = 'error';
export const messageTestId = 'message';

const RegisterPage = () => {
	// define states
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [passwordAgain, setPasswordAgain] = useState('');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [errorField, setErrorField] = useState(defaultErrorField);
	const [validating, setValidating] = useState(false);
	const navigate = useNavigate();

	const eventStore = useContext(eventStoreContext);
	useHandleWindowResize();

	const register = () => {
		// if we're already trying to perform login, do not try again.
		if (validating) return;

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

	// more settings
	const inputs = [
		{
			name: 'username',
			type: 'text',
			placeholder: TranslateService.translate(eventStore, 'USERNAME'),
			icon: 'user',
			value: username,
			setValue: setUsername,
		},
		{
			name: 'password',
			type: 'password',
			placeholder: TranslateService.translate(eventStore, 'PASSWORD'),
			icon: 'lock',
			value: password,
			setValue: setPassword,
		},
		{
			name: 'passwordAgain',
			type: 'password',
			placeholder: TranslateService.translate(eventStore, 'REPEAT_PASSWORD'),
			icon: 'lock',
			value: passwordAgain,
			setValue: setPasswordAgain,
		},
	];

	// building blocks
	const error_block =
		error === '' ? (
			''
		) : (
			<style.Error className={'field'} data-testid={errorTestId}>
				<div dangerouslySetInnerHTML={{ __html: TranslateService.translate(eventStore, error) }} />
			</style.Error>
		);
	const message_block =
		message === '' || error !== '' ? (
			''
		) : (
			<style.Message className={'field'} data-testid={messageTestId}>
				<div dangerouslySetInnerHTML={{ __html: message }} />
			</style.Message>
		);

	const headerProps = {
		withLogo: false,
		withSearch: false,
		withViewSelector: false,
		withMyTrips: false,
		withFilterTags: false,
		withLoginLogout: false,
	};

	return (
		<div className={'padding-inline-30'}>
			<TriplanHeaderWrapper {...headerProps} />
			<style.Container className={'register-page ui header cards centered'}>
				<style.SubContainer>
					<div
						onClick={() => {
							navigate('/home');
						}}
					>
						<Logo />
					</div>
					<div className={'sub cards header content'}>
						<div className={'ui segment'}>
							{message_block}
							{error_block}
							{inputs.map((input, idx) => {
								const { name, type, placeholder, icon, value, setValue } = input;
								return (
									<div key={`register-${name}-idx`}>
										<TextInputWrapper
											key={`register-${name}-idx`}
											name={name}
											type={type}
											icon={icon}
											disabled={validating}
											placeholder={placeholder}
											error={errorField[name]}
											value={value}
											onChange={(e) => {
												setValue(e.target.value);
												setErrorField({ ...errorField, [name]: false });
											}}
											onKeyDown={(e) => onKeyDown(e.keyCode)}
											data-testid={name}
											autoComplete={'off'}
										/>
									</div>
								);
							})}
							<style.Button
								validating={validating}
								className="ui fluid large button primary-button"
								data-testid={'submit'}
								onClick={register}
							>
								{TranslateService.translate(eventStore, 'REGISTER_BUTTON')}
							</style.Button>
						</div>
						<div className={'login-link-container'} key={'login-link-container'}>
							<style.RegisterLink>
								{TranslateService.translate(eventStore, 'LOGIN_PREFIX')}{' '}
								<Link data-testid={'login'} to={'/login'}>
									{TranslateService.translate(eventStore, 'LOGIN_LINK')}
								</Link>
							</style.RegisterLink>
						</div>
					</div>
				</style.SubContainer>
			</style.Container>
		</div>
	);
};

export default observer(RegisterPage);
