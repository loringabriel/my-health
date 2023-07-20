import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { MeasurementEditor } from '~/routes/resources+/measurement-editor.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'

export async function loader({ params, request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const measurement = await prisma.measurements.findFirst({
		where: {
			id: params.measurementId,
			ownerId: userId,
		},
	})
	if (!measurement) {
		throw new Response('Not found', { status: 404 })
	}
	return json({ measurement: measurement })
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="absolute inset-0">
			<MeasurementEditor measurement={data.measurement} />
		</div>
	)
}
