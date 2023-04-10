import React, { useState, useEffect } from 'react';
import './react-toastr.scss';
import { getClasses } from '../../utils/utils';

interface ToastProps {
	message: string;
	duration?: number;
	show?: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, duration = 3000, show: _show = false }) => {
	const [show, setShow] = useState(_show);

	useEffect(() => {
		setShow(_show);
		const timer = setTimeout(() => {
			setShow(false);
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, _show]);

	return (
		<div className={getClasses('toastr-container', show && 'show')}>
			<div className={getClasses('toast', show && 'show')}>
				<div className="flex-row gap-4">
					{message}
					<img src={'/images/icons8-done.gif'} height={20} />
				</div>
			</div>
		</div>
	);
};

export default Toast;
