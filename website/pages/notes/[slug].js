import gfm from 'remark-gfm'
import Airtable from 'airtable-plus'
import Head from 'next/head'
import remarkInlineLinks from 'remark-inline-links'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Code } from '../../Components/Code'
import fm from 'front-matter'

export default function Note({ note }) {
	return (
		<>
			<Head>
				<title>{note.title}</title>
			</Head>

			<h1>{note.title}</h1>
			<small>
				<time>
					Created on{' '}
					{new Date(note.createdAt).toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					})}
				</time>
			</small>
			{note.frontmatter && (
				<table className="frontmatter">
					<thead>
						{Object.keys(note.frontmatter).map((key) => (
							<th>{key}</th>
						))}
					</thead>
					<tbody>
						<tr>
							{Object.values(note.frontmatter).map((value) => (
								<td>{value}</td>
							))}
						</tr>
					</tbody>
				</table>
			)}
			<ReactMarkdown
				remarkPlugins={[remarkInlineLinks, gfm]}
				rehypePlugins={[rehypeRaw]}
				components={{
					code: Code,
					link: (props) => {
						return props.href.startsWith('/') ? (
							<a href={props.href}>{props.children}</a>
						) : (
							<a
								href={props.href}
								target="_blank"
								rel="nofollow noopener noreferrer"
							>
								{props.children}
							</a>
						)
					},
				}}
			>
				{note.data}
			</ReactMarkdown>
		</>
	)
}
export async function getServerSideProps({ query }) {
	const { AIRTABLEAPIKEY, AIRTABLEBASE, AIRTABLEVIEW } = process.env
	const base = new Airtable({
		baseID: AIRTABLEBASE,
		apiKey: AIRTABLEAPIKEY,
		tableName: AIRTABLEVIEW,
	})

	const records = await base.read({
		filterByFormula: `{slug} = '${query.slug}'`,
		maxRecords: 1,
	})

	if (!records.length) return { notFound: true }

	const note = records[0].fields
	const parsedMD = fm(note.data)

	return {
		props: {
			note: {
				...note,
				data: parsedMD.body,
				frontmatter: JSON.parse(JSON.stringify(parsedMD.attributes)),
			},
		},
	}
}
