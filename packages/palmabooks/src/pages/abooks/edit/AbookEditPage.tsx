import { useApp, useTransResolver } from "@/app/app.hooks"
import { AppLocalLayout, AutonomousAbookEdit } from "@/components"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom } from "@teawithsand/fstate"
import {
	Container,
	LoadingSuspenseBoundary,
	RouteParamsSchemas,
	Stack,
	Title,
	useRouteParams,
} from "@teawithsand/mlui"
import { useMemo } from "react"
import styles from "./AbookEditPage.module.scss"

interface AbookEditPageContentProps {
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
}

const AbookEditPageContent = ({
	abookDataWithIdAtom,
}: AbookEditPageContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="xl">
			<Title order={1} className={styles.title}>
				{resolve((t) => t.abook.edit.pageTitle)}
			</Title>
			<AutonomousAbookEdit abookDataWithIdAtom={abookDataWithIdAtom} />
		</Stack>
	)
}

export const AbookEditPage = () => {
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
		<AppLocalLayout>
			<LoadingSuspenseBoundary>
				<Container
					fullWidth
					size="md"
					className={styles.container}
					pt="md"
				>
					<AbookEditPageContent
						abookDataWithIdAtom={abookDataWithIdAtom}
					/>
				</Container>
			</LoadingSuspenseBoundary>
		</AppLocalLayout>
	)
}
