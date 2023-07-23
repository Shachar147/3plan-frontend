import React, { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataServices } from '../../services/data-handlers/data-handler-base';
import ReactModalService from '../../services/react-modal-service';
import { eventStoreContext } from '../../stores/events-store';
import { runInAction } from 'mobx';

function InviteLink() {
	const eventStore = useContext(eventStoreContext);
	const navigate = useNavigate();

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const token = searchParams.get('token');

	// todo complete: try to use the invite link. if it's working, redirect user to the trip page.
	// otherwise - show error message.
	// if the same user that did the invite try to use it, either show error or simply redirect him.
	useEffect(() => {
		if (!token) {
			return;
		}
		DataServices.DBService.useInviteLink(token)
			.then((response) => {
				const trip = response.data;
				const tripName = trip.name;

				runInAction(() => {
					// manually set loading before redirect to the page to prevent a bug of
					// glimpse view of the previous trip before updating to this one.
					eventStore.isLoading = true;
					eventStore.setTripName(tripName);
				});
				navigate('/plan/' + tripName, {});
			})
			.catch(() => {
				ReactModalService.internal.openOopsErrorModal(eventStore);
			});
	}, [token]);

	return <div>{token}</div>;
}

export default InviteLink;
