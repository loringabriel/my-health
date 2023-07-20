import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { floatingToolbarClassName } from '~/components/floating-toolbar.tsx'
import { ErrorList } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { getUserId, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { getDateTimeFormat } from '~/utils/misc.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const userId = await getUserId(request)
	const measurement = await prisma.measurements.findUnique({
		where: {
			id: params.measurementId,
		},
		select: {
			id: true,
			description: true,
			dia: true,
			sys: true,
			pulse: true,
			createdAt: true,
			updatedAt: true,
			ownerId: true
		},
	})
	if (!measurement) {
		throw new Response('Not found', { status: 404 })
	}
	const date = new Date(measurement.updatedAt)
	const timeAgo = formatDistanceToNow(date)
	return json({
		measurement,
		timeAgo,
		dateDisplay: getDateTimeFormat(request).format(date),
		isOwner: userId === measurement.ownerId,
	})
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-measurement'),
	measurementId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: DeleteFormSchema,
		acceptMultipleErrors: () => true,
	})
	if (!submission.value || submission.intent !== 'submit') {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}

	const { measurementId } = submission.value

	const measurement  = await prisma.measurements.findFirst({
		select: { id: true, owner: { select: { username: true } } },
		where: {
			id: measurementId ,
			ownerId: userId,
		},
	})
	if (!measurement) {
		submission.error.measurementId = ['Measurement not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.measurements.delete({
		where: { id: measurement.id },
	})

	return redirectWithToast(`/users/${measurement.owner.username}/measurements`, {
		title: 'Measurement deleted',
		variant: 'destructive',
	})
}

export default function MeasurementRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<>
			<div className="absolute inset-0 flex flex-col px-10">
				<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.measurement.description}</h2>
				<div className={`${data.isOwner ? 'pb-24' : 'pb-12'} overflow-y-auto`}>
				<p className="whitespace-break-spaces text-sm md:text-lg">
						Sys: {data.measurement.sys}
					</p>
					<p className="whitespace-break-spaces text-sm md:text-lg">
						Dia: {data.measurement.dia}
					</p>
					<p className="whitespace-break-spaces text-sm md:text-lg">
						Pulse: {data.measurement.pulse}
					</p>
				</div>
			</div>
			{data.isOwner ? (
				<div className={floatingToolbarClassName}>
					<span
						className="text-sm text-foreground/90 max-[524px]:hidden"
						title={data.dateDisplay}
					>
						<Icon name="clock" className="mr-2 scale-125">
							{data.timeAgo} ago
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						<DeleteMeasurement id={data.measurement.id} />
						<Button
							asChild
							className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
						>
							<Link to="edit">
								<Icon
									name="pencil-1"
									className="scale-125 max-md:scale-150 md:mr-2"
								/>
								<span className="max-md:hidden">Edit</span>
							</Link>
						</Button>
					</div>
				</div>
			) : null}
		</>
	)
}

export function DeleteMeasurement({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()
	const [form] = useForm({
		id: 'delete-measurement',
		lastSubmission: actionData?.submission,
		constraint: getFieldsetConstraint(DeleteFormSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: DeleteFormSchema })
		},
	})

	return (
		<Form method="post" {...form.props}>
			<input type="hidden" name="measurementId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-measurement"
				variant="destructive"
				status={
					navigation.state === 'submitting' &&
					navigation.formAction === formAction &&
					navigation.formData?.get('intent') === 'delete-measurement' &&
					navigation.formMethod === 'POST'
						? 'pending'
						: actionData?.status ?? 'idle'
				}
				disabled={navigation.state !== 'idle'}
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" className="scale-125 max-md:scale-150 md:mr-2" />
				<span className="max-md:hidden">Delete</span>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Measurement not found</p>,
			}}
		/>
	)
}
