import React from 'react';

interface PreviewBoxProps {
	size: number;
	color: string;
}

export default function PreviewBox(props: PreviewBoxProps) {
	return (
		<div
			className="preview"
			key={JSON.stringify(props)}
			style={{
				width: props.size,
				height: props.size,
				backgroundColor: props.color,
			}}
		/>
	);
}
