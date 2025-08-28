import type { Preview } from "@storybook/react"
import { MluiProvider } from "@teawithsand/mlui"
import { AppBoundary } from "../src/app/app.boundary"
import { AppDi } from "../src/app/app.di"
import { AppProvider } from "../src/app/app.provider"

import "@teawithsand/mlui/dist/index.css"

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		(Story) => (
			<MluiProvider>
				<AppProvider config={AppDi.DI_TEST_CONFIG}>
					<AppBoundary>
						<Story />
					</AppBoundary>
				</AppProvider>
			</MluiProvider>
		),
	],
}

export default preview
