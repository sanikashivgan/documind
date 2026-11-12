# DocuMind

DocuMind is an in-development document intelligence web application. It helps users upload a document, read its extracted text, find relevant passages, and ask questions about evidence contained in that document.

The application combines a Next.js interface and server routes with Supabase authentication, Postgres, and private Storage. Optional Gemini-backed answers are grounded in passages retrieved from the selected document.

> **Status:** Local application code and deterministic offline evaluation are available. Live Gemini Q&A and production deployment have not been verified. Large-document performance testing is pending.

## 1. Problem statement

Finding a useful detail in a long document can be slow, especially when a question uses different wording than the original text. DocuMind provides a document reader and passage retrieval workflow so users can search document content and inspect the excerpts behind an answer.

## 2. Project objectives

- Make it straightforward to add and read supported documents.
- Keep each user's document records and stored files scoped to that user.
- Retrieve relevant excerpts with available section and page details.
- Offer optional, document-grounded AI answers while retaining direct passage search as a non-AI fallback.
- Evaluate local retrieval behavior against a repeatable, annotated fixture set.

## 3. Key features

- Supabase email/password sign-up and sign-in, email confirmation callback, sign-out, and password reset.
- Authenticated dashboard with document upload, list search, pagination, and deletion.
- PDF, DOCX, and TXT validation, text extraction, and per-user duplicate-content detection.
- Document reader with headings, paragraphs, lists, and PDF page markers when available.
- Deterministic passage search with result excerpts, section/page metadata, and matched-term counts.
- Optional Gemini answer generation with verbatim-claim checking and supporting excerpts.
- Per-user database and Storage ownership policies in the checked-in Supabase migrations.

Persistent chat history is not implemented; the dashboard currently renders an empty chat-history area.

## 4. Supported file formats and upload limits

| Format | Extension | Extraction |
|---|---|---|
| PDF | `.pdf` | `pdf-parse`; page markers are retained when page-level text is available |
| Word document | `.docx` | Mammoth raw-text extraction |
| Plain text | `.txt` | UTF-8 decoding |

The maximum accepted file size is **10 MiB (10 × 1024 × 1024 bytes)**. Empty, unsupported, or invalid files are rejected. The upload is not saved if no readable text is extracted. OCR is not implemented, so scanned or image-only documents may not yield searchable text.

## 5. How DocuMind works

1. A user creates an account or signs in through Supabase Auth.
2. The user uploads a PDF, DOCX, or TXT file from the dashboard.
3. The server validates the upload, extracts text, computes a content hash, and checks for a duplicate belonging to that user.
4. The file is stored in the `documents` Storage bucket and its extracted text and metadata are saved in `public.documents`.
5. The user opens the document reader and either searches for matching passages or asks an AI question.
6. Passage search returns ranked excerpts from that document. For AI questions, retrieved passages are sent to Gemini and returned claims are checked against the supplied excerpts before sources are shown.

## 6. Technology stack

| Technology | Role |
|---|---|
| Next.js 16.4.3 | App Router pages, server rendering, and route handlers |
| React 19.3.0 | User interface |
| TypeScript | Application implementation |
| Tailwind CSS 4 | Styling |
| Supabase Auth and `@supabase/ssr` | Authentication and cookie-backed sessions |
| Supabase Postgres and Storage | Document metadata/text and uploaded files |
| Gemini API | Optional AI answer generation |
| `pdf-parse` | PDF text extraction |
| Mammoth | DOCX text extraction |
| Node.js built-in test runner | Unit tests and offline evaluation |

## 7. System architecture

```text
Browser
  └─ Next.js pages and React components
       └─ Next.js route handlers
            ├─ Supabase Auth: establish the current user
            ├─ Supabase Postgres: document metadata and extracted text
            ├─ Supabase Storage: uploaded document files
            └─ Server-side document processing
                 ├─ PDF  → pdf-parse
                 ├─ DOCX → Mammoth
                 └─ TXT  → UTF-8 decoder

Question about one document
  ├─ Search → local passage retrieval → excerpt results
  └─ Ask AI → local passage retrieval → Gemini → verbatim-source check
                                                → answer and cited excerpts
```

Document routes authenticate the user and filter document access by that user's ID. Supabase Row Level Security and Storage policies provide an additional ownership boundary when the checked-in migrations are applied.

## 8. Project folder structure

```text
documind/
├─ app/
│  ├─ api/documents/          # Upload/list, delete, search, and answer routes
│  ├─ auth/callback/          # Supabase auth callback
│  ├─ documents/[id]/         # Authenticated document reader page
│  ├─ dashboard/              # Authenticated document dashboard
│  ├─ login/ signup/           # Authentication pages
│  └─ forgot-password/ reset-password/
├─ components/
│  ├─ auth/                   # Authentication forms and layout
│  ├─ dashboard/              # Dashboard UI and upload controls
│  ├─ documents/              # Reader and question/search UI
│  └─ landing/                # Landing page sections
├─ lib/
│  ├─ documents/              # Extraction, retrieval, grounding, and tests
│  ├─ documents/evaluation/   # Offline fixtures, questions, runner, tests
│  └─ supabase/               # Browser and server Supabase clients
├─ public/                    # Static assets
├─ scripts/
│  └─ large-document-performance.mjs
├─ supabase/migrations/       # Document ownership, bucket, and hash SQL
├─ package.json
└─ README.md
```

The large-document harness writes generated fixtures and its report under the ignored `test-fixtures/.generated/` directory.

## 9. Prerequisites

- Windows 10 or later with PowerShell.
- Node.js LTS and npm.
- Git.
- A Supabase project for authentication, Postgres, and Storage.
- A Gemini API key only if you want to use AI answers.

## 10. Installation and local setup (Windows)

In PowerShell, clone the repository and install the locked dependencies:

```powershell
git clone https://github.com/sanikashivgan/documind.git
Set-Location documind
npm ci
```

Create or edit a local `.env.local` file in the project root and set the variables listed below. Keep the file local; it is ignored by `.gitignore`.

## 11. Environment variables

The application reads these variable names. This README intentionally contains no secret values.

| Name | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by the browser and server clients. |
| `GEMINI_API_KEY` | Optional server-side Gemini API key for AI answers. Do not prefix it with `NEXT_PUBLIC_`. |

Obtain values from the relevant provider project settings. Do not add a Supabase service-role key, passwords, tokens, or other privileged credentials to client code or the repository. The publishable key is intended for browser use; the Gemini key is read only by the server.

## 12. Supabase setup, database prerequisites, Storage, and migrations

1. Create a Supabase project and enable email/password authentication.
2. Set the local site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` in the Auth redirect URL settings. Sign-up confirmation and password recovery use this callback.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
4. Provision the base `public.documents` table. **This repository does not include a migration that creates the initial table.** The application uses fields named `id`, `user_id`, `name`, `storage_path`, `file_type`, `file_size`, `extracted_text`, `processing_status`, and `created_at`; the ownership migration specifically requires `user_id` to be a UUID.
5. Create a Storage bucket named `documents` before applying the ownership-policy migration. Keep it private. The bucket migration below also creates the bucket if missing and enforces `public = false`.
6. Apply the checked-in SQL files under `supabase/migrations/` to the project:
   - `20261102201500_document_ownership_policies.sql` enables row-level security and adds per-user table and Storage policies. It assumes the base table and bucket already exist.
   - `20261106195500_enforce_private_documents_bucket.sql` creates or enforces the non-public `documents` bucket.
   - `20261106213400_add_document_content_hash.sql` adds the SHA-256 `content_hash` column, its format constraint, and a per-user unique index.

These are incremental migrations, not a complete database bootstrap. Review and provision the required base table and bucket before applying the ownership policies; do not assume the migrations create the entire schema.

## 13. How to run the application

After configuring Supabase and `.env.local`, start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, confirm the email if confirmation is enabled, and sign in. Set `GEMINI_API_KEY` and restart the server to enable AI answers. Passage search does not call Gemini.

Other package scripts:

```powershell
npm run lint
npm run build
npm start
```

`npm start` serves the production build and should be run after `npm run build`.

## 14. API routes

| Method and route | Purpose |
|---|---|
| `GET /api/documents` | List the signed-in user's documents; accepts the implemented search and pagination parameters. |
| `POST /api/documents` | Validate, extract, and store a supported file; checks for duplicate content for that user. |
| `DELETE /api/documents/[id]` | Delete an owned document record and its Storage object. |
| `POST /api/documents/[id]/search` | Retrieve and return matching passages from an owned document. |
| `POST /api/documents/[id]/answer` | Retrieve evidence and request a grounded Gemini answer for an owned document. |
| `GET /auth/callback` | Exchange a Supabase callback code and redirect to the dashboard or password-reset flow. |

The document API routes require an authenticated user and scope database operations to that user.

## 15. AI document question-answering and retrieval

The search route performs local retrieval over the selected document's extracted text and returns up to three matching excerpts with available section/page metadata. It does not call an AI provider.

The answer route:

1. Validates the authenticated user's question and loads only that user's document text.
2. Retrieves a bounded set of relevant passages from that document.
3. Sends the question and passages to the Gemini `gemini-3.5-flash-lite` model with instructions to return verbatim claims and source IDs.
4. Verifies each returned quote against the identified retrieved passage.
5. Returns a supported answer with source excerpts, or declines to provide an unsupported answer.

Gemini use requires network access and `GEMINI_API_KEY`. The implementation is present, but live Gemini Q&A has not been verified for this project.

## 16. Offline evaluation results

The deterministic evaluation runner is:

```powershell
node --experimental-strip-types lib/documents/evaluation/run-evaluation.mjs
```

The focused retrieval and evaluation test command is:

```powershell
node --experimental-strip-types --test lib/documents/retrieval.test.mjs lib/documents/evaluation/evaluation.test.mjs
```

The verified offline evaluation results are:

| Fixture set | Cases passed | Expected evidence in top 1 | In top 3 | In top 6 | Expected answer facts supported |
|---|---:|---:|---:|---:|---:|
| Original | 40/40 | 31/40 | 40/40 | 40/40 | 43/43 |
| Expanded | 49/49 | 38/51 | 50/51 | 51/51 | 54/54 |

The evaluation uses synthetic RiverWatch document fixtures and annotated expected evidence. It measures local retrieval, passage ranking, and whether retrieved passages support annotated answer facts. It does **not** call Gemini, test live generated answers, or demonstrate production or end-to-end application behavior. The focused Node test command last completed with 52 passing tests and no failures.

Large-document performance testing is **pending**. A harness exists at `scripts/large-document-performance.mjs`, but its results are not presented as a completed performance evaluation.

## 17. Current limitations

- The initial `public.documents` schema is not created by the checked-in migrations and must be provisioned separately.
- OCR is not implemented; scanned or image-only files may not produce readable text.
- Live Gemini Q&A and hosted Supabase workflows have not been verified as end-to-end application tests.
- Offline evaluation results apply to the synthetic fixtures and retrieval/fact-support checks only.
- Large-document performance testing is pending.
- Persistent chat history is not implemented.
- No production deployment is claimed.

## 18. Future improvements

- Add a complete baseline schema migration and a repeatable Supabase bootstrap guide.
- Add OCR for scanned documents.
- Expand integration and end-to-end coverage, with live-provider tests run separately and deliberately.
- Complete repeatable large-document performance testing and publish its methodology and results.
- Implement persistent question/answer history if it remains in product scope.
- Add genuine product screenshots and verified deployment information when available.

## 19. Security considerations

- Keep `.env.local` local. `.gitignore` ignores `.env*`, including `.env.local`; do not commit credentials.
- Keep `GEMINI_API_KEY` server-side and never expose it with a `NEXT_PUBLIC_` variable name.
- The Supabase publishable key is browser-facing; never use a service-role key in browser code.
- The API handlers authenticate requests and scope document operations by the current user's ID.
- Apply the database ownership and Storage policies, and keep the `documents` bucket non-public.
- Review the Supabase schema and policies in the target project before using real documents.

These implementation notes do not constitute a security audit or production-readiness claim.

## 20. Contribution and license

No `CONTRIBUTING.md` or contribution process is currently included. No `LICENSE` file is included, so the repository does not specify a reuse or distribution license.
