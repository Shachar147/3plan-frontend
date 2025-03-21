import React from 'react';
import { getClasses } from '../../../utils/utils';

interface StatsTableProps {
	cols: string[];
	stats: Record<string, (number | string)[]>;
	switchMaxNumber?: number;
	showMoreOpened?: boolean;
	showMoreSwitch?: boolean;
	isBold?: boolean;
	direction?: 'right' | 'left';
	noHeader?: boolean;
}

export default function StatsTable({
	cols,
	stats,
	switchMaxNumber = 10,
	showMoreOpened = false,
	showMoreSwitch = true,
	isBold = true,
	direction = 'left',
	noHeader = false,
}: StatsTableProps) {
	return (
		<table className={getClasses('ui celled table', direction === 'right' && 'text-align-right')}>
			{!noHeader && (
				<thead>
					<tr>
						{cols.map((iter, idx) => {
							return (
								<th className={getClasses(idx <= 1 && 'font-weight-bold')} key={`col-${idx}`}>
									{iter}
								</th>
							);
						})}
					</tr>
				</thead>
			)}
			<tbody>
				{Object.keys(stats).map((stat, idx) => {
					if (idx < switchMaxNumber || showMoreOpened || !showMoreSwitch) {
						const values = stats[stat];

						return (
							<tr key={`stat-${idx}`}>
								<td
									className={getClasses(isBold && 'font-weight-bold')}
									dangerouslySetInnerHTML={{ __html: stat }}
								/>
								{values.map((value = 'N/A', i) => (
									<td
										className={getClasses(i === 0 && 'font-weight-bold')}
										dangerouslySetInnerHTML={{ __html: value.toString() }}
									/>
								))}
							</tr>
						);
					}
				})}
			</tbody>
		</table>
	);
}
