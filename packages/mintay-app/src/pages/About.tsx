import { AppBoundary } from "../app"
import { About as AboutComponent } from "../components/about"
import { LocalLayout } from "../components/layout"

export const AboutPage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AboutComponent />
			</AppBoundary>
		</LocalLayout>
	)
}
