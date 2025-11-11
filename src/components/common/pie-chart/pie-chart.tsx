import React from 'react';
import './pie-chart.scss';

interface PieChartData {
	label: string;
	value: number;
	color: string;
}

interface PieChartProps {
	data: PieChartData[];
	size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, size = 180 }) => {
	const total = data.reduce((sum, item) => sum + item.value, 0);
	if (total === 0) {
		return (
			<div className="pie-chart-container">
				<div className="pie-chart-empty">No data</div>
			</div>
		);
	}

	const radius = size / 2 - 10;
	const centerX = size / 2;
	const centerY = size / 2;
	let currentAngle = -90; // Start from top

	const paths = data.map((item, index) => {
		const percentage = (item.value / total) * 100;
		const angle = (item.value / total) * 360;
		const startAngle = currentAngle;
		const endAngle = currentAngle + angle;
		currentAngle = endAngle;

		const startAngleRad = (startAngle * Math.PI) / 180;
		const endAngleRad = (endAngle * Math.PI) / 180;

		const x1 = centerX + radius * Math.cos(startAngleRad);
		const y1 = centerY + radius * Math.sin(startAngleRad);
		const x2 = centerX + radius * Math.cos(endAngleRad);
		const y2 = centerY + radius * Math.sin(endAngleRad);

		const largeArcFlag = angle > 180 ? 1 : 0;

		// Handle edge case where angle is exactly 360 or very close
		const pathData =
			angle >= 360
				? `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX} ${
						centerY + radius
				  } A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius} Z`
				: [
						`M ${centerX} ${centerY}`,
						`L ${x1} ${y1}`,
						`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
						'Z',
				  ].join(' ');

		return (
			<path
				key={index}
				d={pathData}
				fill={item.color}
				stroke="#fff"
				strokeWidth="2"
				data-percentage={percentage.toFixed(1)}
				data-value={item.value}
			/>
		);
	});

	return (
		<div className="pie-chart-container">
			<div className="pie-chart-svg-wrapper">
				<svg
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					style={{ display: 'block' }}
					preserveAspectRatio="xMidYMid meet"
				>
					<circle
						cx={centerX}
						cy={centerY}
						r={radius}
						fill="transparent"
						stroke="rgba(0,0,0,0.05)"
						strokeWidth="1"
					/>
					{paths}
				</svg>
			</div>
			<div className="pie-chart-legend">
				{data.map((item, index) => {
					const percentage = ((item.value / total) * 100).toFixed(1);
					return (
						<div key={index} className="pie-chart-legend-item">
							<div className="pie-chart-legend-color" style={{ backgroundColor: item.color }}></div>
							<span className="pie-chart-legend-label">{item.label}</span>
							<span className="pie-chart-legend-value">
								{item.value} ({percentage}%)
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
