import 'bootstrap/dist/css/bootstrap.css';
import '../src/stylesheets/fonts.css';
import '../src/stylesheets/colors.css';
import '../src/stylesheets/buttons.scss';
import '../src/stylesheets/app.scss';
import '../src/stylesheets/rtl.scss';
import '../src/stylesheets/fontawesome/css/font-awesome.css';
import '../src/stylesheets/mobile.responsive.scss';
import './storybook.styles.scss';

export const parameters = {
	actions: { argTypesRegex: '^on[A-Z].*' },
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
};
