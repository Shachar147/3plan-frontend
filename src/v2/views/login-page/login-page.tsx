import React, {useContext, useEffect, useRef, useState} from 'react';
import { observer } from 'mobx-react';
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import {eventStoreContext} from "../../../stores/events-store";
import {Link, useNavigate} from "react-router-dom";
import './login-page.scss';
import TranslateService from "../../../services/translate-service";
import {errorTestId, messageTestId} from "../../../pages/register-page-old/register-page";
import {loginPageContentTabLsKey, newDesignRootPath} from "../../utils/consts";
import {useInviteLinkLSKey} from "../../../services/data-handlers/db-service";
import Button, {ButtonFlavor} from "../../../components/common/button/button";
import { apiPostWithCallback } from '../../../helpers/api';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import TriplanHeaderBanner from "../../components/triplan-header-banner/triplan-header-banner";
import '../main-page/main-page.scss';
import TabMenu from "../../../components/common/tabs-menu/tabs-menu";
import {rootStoreContext} from "../../stores/root-store";
import {setToken} from "../../../helpers/auth";
import axios from "axios";
import {LOGIN_DELAY} from "../../../utils/consts";

const defaultErrorField: Record<string, boolean> = {
    username: false,
    password: false,
};

function LoginPageV2() {
    const eventStore = useContext(eventStoreContext);
    const rootStore = useContext(rootStoreContext);
    const navigate = useNavigate();
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const passwordAgainRef = useRef<HTMLInputElement>(null);
    const [validating, setValidating] = useState(false);
    const [errorField, setErrorField] = useState(defaultErrorField);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [redirect, setRedirect] = useState(false);
    const [activeTab, setActiveTab] = useState(window.location.href.includes('register') ? 'register' : 'login');

    useHandleWindowResize();

    useEffect(() => {
        const localStorageVal = localStorage.getItem(loginPageContentTabLsKey);
        if (localStorageVal && ['login', 'register'].includes(localStorageVal) && window.location.hash.includes(localStorageVal)) {
            setActiveTab(localStorageVal);
        }

    }, [rootStore.tabMenuReRenderCounter])

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
        let redirectTo = newDesignRootPath;

        const str = localStorage.getItem(useInviteLinkLSKey);
        if (str) {
            const data = JSON.parse(str);
            if (data['expiresIn'] && data['expiresIn'] >= new Date().getTime() && data['token']) {
                redirectTo = `/inviteLink?token=${data['token']}`;
                localStorage.removeItem(useInviteLinkLSKey);
            }
        }
        window.location.href = redirectTo;
    }

    function renderLoginForm(){
        return (
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
                {/*<Button*/}
                {/*    text={TranslateService.translate(eventStore, 'CONTINUE_AS_GUEST')}*/}
                {/*    onClick={continueAsGuest}*/}
                {/*    flavor={ButtonFlavor.secondary}*/}
                {/*    disabled={validating}*/}
                {/*    disabledReason={TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING')}*/}
                {/*    className="black"*/}
                {/*/>*/}
                <Button
                    text={TranslateService.translate(eventStore, 'LOGIN')}
                    onClick={login}
                    flavor={ButtonFlavor.primary}
                    disabled={validating}
                    disabledReason={TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING')}
                />
                <div className="width-300 text-align-center">
                    {TranslateService.translate(eventStore, 'REGISTER_PREFIX')}{' '}
                    <a href={"#register"} data-testid='register' onClick={() => rootStore.navigateToTabOnLoginPage('register')}>
                        {TranslateService.translate(eventStore, 'REGISTER')}
                    </a>
                </div>
            </div>
        </div>
        )
    }

    function renderRegisterForm(){
        return (
            <div className="register-form">
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
                <div className="register-form-buttons">
                    <Button
                        text={TranslateService.translate(eventStore, 'REGISTER_BUTTON')}
                        onClick={register}
                        flavor={ButtonFlavor.primary}
                        disabled={validating}
                        disabledReason={TranslateService.translate(eventStore, 'PLEASE_WAIT_WHILE_SAVING')}
                    />
                    <div className="width-300 text-align-center">
                        {TranslateService.translate(eventStore, 'LOGIN_PREFIX')}{' '}
                        <a href={"#login"} data-testid='login' onClick={() => rootStore.navigateToTabOnLoginPage('login')}>
                            {TranslateService.translate(eventStore, 'LOGIN_LINK')}
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    const onKeyDown = (keyCode: number) => {
        if (keyCode === 13) {
            if (activeTab == 'login'){
                login()
            } else {
                register();
            }
        }
    };

    // region main cations

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
            setError(""); // new
            setValidating(true);

            apiPostWithCallback(
                '/auth/signup',
                {
                    username: username,
                    password: password,
                },
                async function (res: any) {
                    if (res && res.error) {
                        setError(res.error);
                    } else {
                        setMessage('REGISTERED_SUCCESSFULLY');
                        setTimeout(
                             () => {
                                window.location.href = '/login';
                            },
                            LOGIN_DELAY,
                        );
                    }
                },
                (err: any) => {
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

    // endregion

    function renderField({ name, placeholder, icon, type = 'text', ref }: any) {
        return (
            <div className="field flex-column">
                <span>{placeholder}</span>
                <input
                    name={name}
                    className="textInput"
                    type={type}
                    placeholder={eventStore.isMobile || (eventStore.isEnglish && placeholder == TranslateService.translate(eventStore, 'REPEAT_PASSWORD')) ? placeholder : TranslateService.translate(eventStore, 'TYPE_YOUR_X', {
                        X: placeholder
                    })}
                    autoComplete="off"
                    data-testid="username"
                    ref={ref}
                    onKeyDown={(e: any) => onKeyDown(e.keyCode)}
                    disabled={validating}
                />
            </div>
        );
    }

    const images = [
        "/images/mobile-mac-preview-eng.jpeg"
    ]

    function getTabs(){
        const tabs = [
            {
                id: 'login',
                order: 1,
                name: TranslateService.translate(eventStore, 'LOGIN'),
                icon: "fa-sign-in",
                render: () => null
            },
            {
                id: 'register',
                order: 1,
                name: TranslateService.translate(eventStore, 'REGISTER_BUTTON'),
                icon: "fa-user-plus",
                render: () => null
            }
        ];

        if (eventStore.isHebrew) {
            tabs.reverse();
        }
        return tabs;
    }

    function renderTabView(){
        return (
            <>
                <div className="plan-trip-tab-menu">
                    <TabMenu
                        activeTab={activeTab}
                        tabs={getTabs()}
                        onChange={(tabId) => {
                            setActiveTab(tabId);
                            localStorage.setItem(loginPageContentTabLsKey, tabId);
                            window.location.hash = tabId;
                            rootStore.triggerHeaderReRender();
                        }}
                    />
                    {activeTab == 'login' ? renderLoginContainer() : renderRegisterContainer()}
                </div>
            </>
        )
    }

    function renderLoginContainer(){
        return (
            <>
                <div className="login-page-container">
                    <img src={images[0]} />
                    {/*<Carousel showThumbs={false} showIndicators={false} infiniteLoop autoPlay>*/}
                    {/*    {images.map((image, index) => (*/}
                    {/*        <img src={image} />*/}
                    {/*    ))}*/}
                    {/*</Carousel>*/}
                    <div className="divider"/>
                    <div className="flex-column gap-8">
                        <div className="flex-column block-title">
                            <h3>{TranslateService.translate(eventStore, 'LOGIN_PAGE_V2.LOGIN.TITLE')}</h3>
                            <span className="white-space-pre-line max-width-350">{TranslateService.translate(eventStore, 'LOGIN_PAGE_V2.LOGIN.DESCRIPTION')}</span>
                        </div>
                        {renderLoginForm()}
                    </div>
                </div>
            </>
        )
    }

    function renderRegisterContainer(){
        return (
            <>
                <div className="register-page-container">
                    <img src={images[0]} />
                    {/*<Carousel showThumbs={false} showIndicators={false} infiniteLoop autoPlay>*/}
                    {/*    {images.map((image, index) => (*/}
                    {/*        <img src={image} />*/}
                    {/*    ))}*/}
                    {/*</Carousel>*/}
                    <div className="divider"/>
                    <div className="flex-column gap-8">
                        <div className="flex-column block-title">
                            <h3>{TranslateService.translate(eventStore, 'LOGIN_PAGE_V2.REGISTER.TITLE')}</h3>
                            <span className="white-space-pre-line max-width-350">{TranslateService.translate(eventStore, 'LOGIN_PAGE_V2.REGISTER.DESCRIPTION')}</span>
                        </div>
                        {renderRegisterForm()}
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="login-page-v2 flex-column" key={rootStore.tabMenuReRenderCounter}>
            <TriplanHeaderBanner />
            {renderTabView()}
        </div>
    )
}

export default observer(LoginPageV2);
