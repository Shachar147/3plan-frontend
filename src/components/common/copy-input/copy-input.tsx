import React, { useRef } from 'react';
import Button, { ButtonFlavor } from '../button/button';
import TranslateService from '../../../services/translate-service';
import { EventStore } from '../../../stores/events-store';

interface CopyInputProps {
	eventStore: EventStore;
	value: string;
}

const CopyInput: React.FC<CopyInputProps> = ({ eventStore, value }) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleCopyClick = () => {
		if (inputRef.current) {
			inputRef.current.select();
			document.execCommand('copy');
			// Optionally, you can display a message indicating that the text is copied.
			console.log('Text copied to clipboard.');
		}
	};

	return (
		<div className="flex-row gap-8">
			<input ref={inputRef} value={value} readOnly className="flex-1-1-0 outline-none" />
			<Button
				flavor={ButtonFlavor.link}
				icon="fa-clipboard"
				text={TranslateService.translate(eventStore, 'COPY')}
				onClick={handleCopyClick}
			/>
		</div>
	);
};

export default CopyInput;
