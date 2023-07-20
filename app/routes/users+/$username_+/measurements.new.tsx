import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { MeasurementEditor } from '~/routes/resources+/measurement-editor.tsx'
import { requireUserId } from '~/utils/auth.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export default function NewMeasurementRoute() {
	return <MeasurementEditor />
}
