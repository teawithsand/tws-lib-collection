import { AppBoundary } from "../app"
import { About as AboutComponent } from "../components/about"

export const AboutPage = () => {
	return (
		<AppBoundary>
			<AboutComponent />
		</AppBoundary>
	)
}
