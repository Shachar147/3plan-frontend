import TextInput, { TextInputProps, TextInputRef } from '../text-input/text-input';
import React, { Ref, useEffect, useState } from 'react';
import { observer } from 'mobx-react';LocationInput

function LocationInput(props: TextInputProps, ref: Ref<TextInputRef> | any) {

	const [showIcon, setShowIcon] = useState(false);

	// todo fix
	useEffect(() => {
		// @ts-ignore
		console.log("here","changed",window["selectedLocation"]);

		// @ts-ignore
		const shouldShow = window["selectedLocation"] && window["selectedLocation"]["latitude"] && window["selectedLocation"]["longitude"];
		setShowIcon(shouldShow);

		// @ts-ignore
	}, [window["selectedLocation"]]); // Empty array ensures that effect is only run on mount

	return <TextInput
		{...props}
		icon={showIcon ? "fa fa-map-marker" : undefined}
	/>
}

export default observer(LocationInput);