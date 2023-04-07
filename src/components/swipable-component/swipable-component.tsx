import React, { useRef, useState } from 'react';

type SwipeableComponentProps = {
	div1Content: JSX.Element;
	div2Content: JSX.Element;
};

const SwipeableComponent: React.FC<SwipeableComponentProps> = ({ div1Content, div2Content }) => {
	const [activeDiv, setActiveDiv] = useState(1);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleSwipe = (direction: 'left' | 'right') => {
		if (direction === 'left') {
			setActiveDiv(activeDiv === 1 ? 2 : 1);
		} else if (direction === 'right') {
			setActiveDiv(activeDiv === 1 ? 2 : 1);
		}
	};

	const handlePrevClick = () => {
		setActiveDiv(activeDiv === 1 ? 2 : 1);
	};

	const handleNextClick = () => {
		setActiveDiv(activeDiv === 1 ? 2 : 1);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		const startX = e.pageX;

		const handleMouseMove = (e: MouseEvent) => {
			const currentX = e.pageX;
			const diff = currentX - startX;
			if (diff > 50) {
				handleSwipe('left');
				containerRef.current?.removeEventListener('mousemove', handleMouseMove);
			} else if (diff < -50) {
				handleSwipe('right');
				containerRef.current?.removeEventListener('mousemove', handleMouseMove);
			}
		};

		containerRef.current?.addEventListener('mousemove', handleMouseMove);
		containerRef.current?.addEventListener('mouseup', () => {
			containerRef.current?.removeEventListener('mousemove', handleMouseMove);
		});
	};

	return (
		<div className="swipeable-container">
			<div className="navigation">
				<button onClick={handlePrevClick}>&#8592; Prev</button>
				<button onClick={handleNextClick}>Next &#8594;</button>
			</div>
			<div className="content-container" ref={containerRef} onMouseDown={handleMouseDown}>
				{activeDiv === 1 && <div className="content-div1 cursor-grab">{div1Content}</div>}
				{activeDiv === 2 && <div className="content-div2 cursor-grab">{div2Content}</div>}
			</div>
			<div className="swipe-instruction">
				<p>You can either click on the navigation buttons above or swipe left or right to navigate.</p>
			</div>
		</div>
	);
};

export default SwipeableComponent;
