import React, { useState, useEffect } from 'react';
import './react-toastr.scss';

interface ToastProps {
	message: string;
	duration?: number;
	show?: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, duration = 3000, show: _show = false }) => {
	const [show, setShow] = useState(_show);

	useEffect(() => {
		console.log('here');
		setShow(_show);
		const timer = setTimeout(() => {
			console.log('there');
			setShow(false);
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, _show]);

	return (
		<div className="toastr-container">
			<div className={`toast ${show ? 'show' : ''}`}>
				<div className="flex-row gap-4">
					{message}
					<img src={'/images/icons8-done.gif'} height={20} />
				</div>
			</div>
		</div>
	);
};

export default Toast;
