import React from 'react';
import TriplanHeader, { TriplanHeaderProps } from './triplan-header';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';

const TriplanHeaderWrapper = (props: TriplanHeaderProps) => {
	const navigate = useNavigate();
	return <TriplanHeader onLogoClick={() => navigate('/')} onMyTripsClick={() => navigate('/my-trips')} {...props} />;
};

export default observer(TriplanHeaderWrapper);
