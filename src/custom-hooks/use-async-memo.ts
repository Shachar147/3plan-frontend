import { useState, useEffect, useMemo } from 'react';

type AsyncFunction<T> = () => Promise<T>;

interface AsyncMemoResult<T> {
	data: T | null;
	loading: boolean;
	error: Error | null;
}

const useAsyncMemo = <T>(asyncFn: AsyncFunction<T>, deps: any[], initialData: T | null = null): AsyncMemoResult<T> => {
	const [data, setData] = useState<T | null>(initialData);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);
				const result = await asyncFn();
				if (isMounted) {
					setData(result);
					setLoading(false);
				}
			} catch (err) {
				if (isMounted) {
					// @ts-ignore
					setError(err);
					setLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isMounted = false;
		};
	}, [...deps]); // IMPORTANT: Spread the deps array to avoid issues with memoization

	const memoizedData = useMemo(() => data, [data]);

	return { data: memoizedData, loading, error };
};

export default useAsyncMemo;
