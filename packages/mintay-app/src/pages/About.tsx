import { AppBoundary } from "../app"
import { About as AboutComponent } from "../components/about"

export const About = () => {
	return (
		<AppBoundary>
			<AboutComponent />
		</AppBoundary>
	)
}
