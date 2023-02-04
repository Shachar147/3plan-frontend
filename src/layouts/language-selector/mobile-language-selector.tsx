import { observer } from 'mobx-react';
import * as React from 'react';
import LanguageSelector from '../../components/triplan-header/language-selector/language-selector';
import MobileHeader from '../../components/mobile-header/mobile-header';
import './mobile-language-selector.scss';

const MobileLanguageSelectorPage = () => {
	return (
		<div className="mobile-language-selector-page">
			<MobileHeader withSearch={false} withLogo={true} />
			<div className="language-selector-container">
				<LanguageSelector />
			</div>
		</div>
	)
}

export default observer(MobileLanguageSelectorPage)