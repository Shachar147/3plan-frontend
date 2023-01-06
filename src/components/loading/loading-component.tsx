// @ts-ignore
import React from 'react';
import { observer } from 'mobx-react';
import { Loader, LOADER_DETAILS } from '../../utils/utils';

interface LoadingComponentProps {
	title: string;
	message: string;
	loaderDetails: Loader;
}

function LoadingComponent({ title, message, loaderDetails }: LoadingComponentProps) {
	loaderDetails = loaderDetails || LOADER_DETAILS();

	const textStyle: any = { fontWeight: 'normal' };
	if (loaderDetails.textColor) {
		textStyle.color = loaderDetails.textColor;
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				zIndex: 999,
			}}
		>
			<div
				className="flex-column align-items-center justify-content-center"
				style={{ width: '100%', height: '100%', backgroundColor: loaderDetails.backgroundColor }}
			>
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						textAlign: 'center',
					}}
				>
					<div>
						<img src={loaderDetails.loader} style={{ width: '80%', maxWidth: '800px' }} />
						<div
							className="flex-col gap-15 padding-top-50 align-items-center justify-content-center"
							style={{ top: loaderDetails.top }}
						>
							<div style={{ fontSize: '20px', color: loaderDetails.titleTextColor }}>
								<b>{title}</b>
							</div>
							<p style={textStyle} dangerouslySetInnerHTML={{ __html: message }} />
						</div>
						{/*<div className="flex-column" style={{ width:"100%", textAlign: "center", top: loaderDetails.top, fontSize: "20px", fontWeight: "bold", position: "relative"}}>*/}
						{/*    <div className="header" style={textStyle}>*/}
						{/*        {title}*/}
						{/*    </div>*/}
						{/*    <p style={textStyle} dangerouslySetInnerHTML={{ __html: message }} />*/}
						{/*</div>*/}
					</div>
				</div>
			</div>
		</div>
	);
}

export default observer(LoadingComponent);
