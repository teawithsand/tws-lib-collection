import { useApp } from "@/app/app.hooks"
import { AutonomousAbookShow } from "@/components"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom } from "@teawithsand/fstate"
import {
	Container,
	LoadingSuspenseBoundary,
	RouteParamsSchemas,
	useRouteParams,
} from "@teawithsand/mlui"
import { useMemo } from "react"

interface AbookShowPageContentProps {
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
}

const AbookShowPageContent = ({
	abookDataWithIdAtom,
}: AbookShowPageContentProps) => {
	return <AutonomousAbookShow abookDataWithIdAtom={abookDataWithIdAtom} />
}

export const AbookShowPage = () => {
	const app = useApp()
	const params = useRouteParams()
	const id = params.resolve(RouteParamsSchemas.idParamSchema)

	const abookDataWithIdAtom = useMemo(() => {
		if (!id) {
			return app.abookStoreService.getAbook("").dataWithId
		}

		return app.abookStoreService.getAbook(id).dataWithId
	}, [app, id])

	return (
		<LoadingSuspenseBoundary>
			<Container fullWidth>
				<AbookShowPageContent
					abookDataWithIdAtom={abookDataWithIdAtom}
				/>
			</Container>
		</LoadingSuspenseBoundary>
	)
}
