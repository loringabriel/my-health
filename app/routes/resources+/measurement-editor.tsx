import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { DateField, ErrorList, Field } from '~/components/forms.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { floatingToolbarClassName } from '~/components/floating-toolbar.tsx'

type Measurement = {
	id?: string,
	description?: string | null,
	createdAt: Date | string,
	sys: string
	dia: string,
	pulse: string
}

export const MeasureEditorSchema = z.object({
	id: z.string().optional(),
	description: z.string().optional(),
	createdAt: z.preprocess((arg) => {
		if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
	  }, z.date()),
	sys: z.string(),
	dia: z.string(),
	pulse: z.string()
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: MeasureEditorSchema,
		acceptMultipleErrors: () => true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	let measurement: { id: string; owner: { username: string } }

	const { description,createdAt, sys, dia, pulse, id } = submission.value

	const data = {
		ownerId: userId,
		description:  description,
		createdAt: createdAt,
		sys: sys,
		dia: dia,
		pulse: pulse
	}

	const select = {
		id: true,
		owner: {
			select: {
				username: true,
			},
		},
	}
	if (id) {
		const existingMeasurement = await prisma.measurements.findFirst({
			where: { id, ownerId: userId },
			select: { id: true },
		})
		if (!existingMeasurement) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		measurement = await prisma.measurements.update({
			where: { id },
			data,
			select,
		})
	} else {
		measurement = await prisma.measurements.create({ data, select })
	}
	return redirectWithToast(`/users/${measurement.owner.username}/measurements/${measurement.id}`, {
		title: id ? 'Measurement updated' : 'Measurement created',
	})
}

export function MeasurementEditor({
	measurement,
}: {
	measurement?: Measurement
}) {
	const measurementEditorFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'measurement-editor',
		constraint: getFieldsetConstraint(MeasureEditorSchema),
		lastSubmission: measurementEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: MeasureEditorSchema })
		},
		defaultValue: {
			description: measurement?.description,
			dia: measurement?.dia,
			sys: measurement?.sys,
			pulse: measurement?.pulse,
			createdAt: measurement?.createdAt
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<measurementEditorFetcher.Form
			method="post"
			action="/resources/measurement-editor"
			className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
			{...form.props}
		>
			<input name="id" type="hidden" value={measurement?.id} />
			<DateField
				labelProps={{ children: 'Date' }}
				inputProps={{
					...conform.input(fields.createdAt),
				}}
				errors={fields.pulse.errors}
				className="flex flex-col gap-y-2"
				
			/>
			<div className='flex gap-6 w-full'>
			<Field
				labelProps={{ children: 'Sys *' }}
				inputProps={{
					...conform.input(fields.sys),
					autoFocus: true,
					type: 'number',
					
				
				}}
				errors={fields.sys.errors}
				className="flex flex-col gap-y-2 flex-grow"
			/>
			<Field
				labelProps={{ children: 'Dia *' }}
				inputProps={{
					...conform.input(fields.dia),
					autoFocus: true,
					type: 'number'
				}}
				errors={fields.dia.errors}
				className="flex flex-col gap-y-2 flex-grow"
			/>
			<Field
				labelProps={{ children: 'Pulse *' }}
				inputProps={{
					...conform.input(fields.pulse),
					autoFocus: true,
					type: 'number',
				}}
				errors={fields.pulse.errors}
				className="flex flex-col gap-y-2 flex-grow"
			/>
			</div>
		
			

<Field
				labelProps={{ children: 'Description' }}
				inputProps={{
					...conform.input(fields.description),
					autoFocus: true,
				}}
				errors={fields.description.errors}
				className="flex flex-col gap-y-2"
			/>


			
			
			{/* <Field
				labelProps={{ children: 'Date' }}
				inputProps={{
					...conform.input(fields.createdAt),
					autoFocus: true,
					type: 'date',
				}}
				errors={fields.createdAt.errors}
				className="flex flex-col gap-y-2"
			/> */}
			<ErrorList errors={form.errors} id={form.errorId} />
			<div className={floatingToolbarClassName}>
				<Button
					variant="destructive"
					type="reset"
					className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
				>
					<Icon name="reset" className="scale-125 max-md:scale-150 md:mr-2" />
					<span className="max-md:hidden">Reset</span>
				</Button>
				<StatusButton
					status={
						measurementEditorFetcher.state === 'submitting'
							? 'pending'
							: measurementEditorFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={measurementEditorFetcher.state !== 'idle'}
					className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
				>
					<Icon
						name="arrow-right"
						className="scale-125 max-md:scale-150 md:mr-2"
					/>
					<span className="max-md:hidden">Submit</span>
				</StatusButton>
			</div>
		</measurementEditorFetcher.Form>
	)
}
