import { AutonomousAbookShow } from "@/components/abook/show/AutonomousAbookShow"
import { AppLocalLayout, AppLocalLayoutVariant } from "@/components/layout"
import { Container, useRouteParams } from "@teawithsand/mlui"
import { z } from "zod"

const routeParamsSchema = z.object({
	id: z.string(),
})

export const AbookShowPage = () => {
	const routeParams = useRouteParams()
	const { id } = routeParams.resolve(routeParamsSchema)

	return (
		<AppLocalLayout variant={AppLocalLayoutVariant.DEFAULT}>
			<Container>
				<AutonomousAbookShow id={id} />
			</Container>
		</AppLocalLayout>
	)
}
