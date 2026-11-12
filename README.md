# DocuMind

DocuMind is a document-reading web application. Users can upload supported documents, read the extracted text, find relevant passages, and ask questions whose answers are constrained to evidence from the selected document.

> **Project status:** In development. Local source and offline evaluation are available; deployment and live Gemini testing are not confirmed.

## Problem and objectives

Long documents can be difficult to search when a user's question does not use the same words as the source. DocuMind aims to make document review more direct by:

- Keeping a user's document library private to their account.
- Extracting readable text from common document formats.
- Showing relevant passages and their available page or section information.
- Providing document-grounded answers with supporting excerpts when the AI provider is configured.

## Implemented features

- Email/password sign-up and sign-in, email confirmation callback, sign-out, and password reset.
- Authenticated dashboard with a document list, search, pagination, and document deletion.
- PDF, DOCX, and TXT upload with type/content checks, a 10 MiB per-file limit, and duplicate-content detection per user.
- Server-side text extraction and a document reader that preserves PDF page markers where available.
- Deterministic passage search with section/page metadata.
- Optional Gemini-backed answers. The answer route requests verbatim claims, checks them against retrieved passages, and returns supporting source excerpts; passage search remains available without a Gemini key.
- Supabase row-level and Storage ownership policies in the checked-in migrations.

The dashboard currently shows an empty chat-history area; persistent chat history is not implemented.

## Screenshots

There are no product screenshots in the repository yet. No screenshots are fabricated or substituted with the generic framework icons in `public/`.

## Technology stack

| Technology | Use |
|---|---|
| Next.js 16 and React 19 | Web application, pages, and route handlers |
| TypeScript | Application code |
| Tailwind CSS 4 | Styling |
| Supabase Auth and `@supabase/ssr` | Authentication and cookie-backed sessions |
| Supabase Postgres and Storage | User-owned document metadata/text and private file storage |
| Gemini API | Optional AI answer generation |
| `pdf-parse` | PDF text extraction |
| Mammoth | DOCX text extraction |
| Node.js built-in test runner | Unit tests and offline evaluation |

## Architecture and workflow

```text
Browser
  ├─ Next.js pages/components
  └─ Next.js route handlers
       ├─ Supabase Auth: identify the signed-in user
       ├─ Supabase Postgres: document metadata and extracted text
       ├─ Supabase Storage: private uploaded files
       └─ Local extraction/retrieval
            ├─ PDF: pdf-parse
            ├─ DOCX: Mammoth
            └─ TXT: UTF-8 decoding

Document question
  ├─ Search passages: retrieve and return matching excerpts locally
  └─ Ask AI: retrieve passages → Gemini API → verify verbatim claims
                 against those passages → return answer and sources
```

Uploads are authenticated and associated with the current user. The server validates the file, extracts text, stores the file in the private `documents` bucket, and saves the document record. The reader and question/search routes load only records owned by that user. AI answers require `GEMINI_API_KEY`; search does not call Gemini.

## Installation on Windows

Install a current Node.js LTS release and Git, then run these commands in PowerShell:

```powershell
git clone https://github.com/sanikashivgan/documind.git
Set-Location documind
npm install
```

Create a local `.env.local` file in the project root and configure the variables below. Do not commit this file.

### Environment configuration

The application reads these environment variable names:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
```

Use the project URL and publishable key from your Supabase project settings. Obtain the Gemini key from your Google AI configuration if you want AI answers. The Gemini key is read by the server and must not be given a `NEXT_PUBLIC_` prefix. Search and document reading can be used without it; the AI answer endpoint reports that AI is unconfigured.

The Supabase publishable key is intended for browser use. Do not put a Supabase service-role key, passwords, or other privileged credentials in client code or this README. `.env*` files are ignored by the repository's `.gitignore`.

## Supabase setup and migrations

1. Create a Supabase project and configure email/password authentication.
2. Set the local site URL to `http://localhost:3000` and allow the callback URL `http://localhost:3000/auth/callback` in the Auth redirect URL settings. Sign-up confirmation and password recovery return through this callback.
3. Configure the two Supabase environment variables in `.env.local`.
4. Provision the base `public.documents` table and the `documents` Storage bucket. The ownership-policy migration assumes that the table (including a UUID `user_id` column) and bucket already exist. The table-creation migration is not included in this repository. The application expects document fields named `id`, `user_id`, `name`, `storage_path`, `file_type`, `file_size`, `extracted_text`, `processing_status`, and `created_at`.
5. Apply the SQL files in `supabase/migrations/` to the project. The bucket migration creates or enforces a non-public `documents` bucket; the ownership migration applies row-level and Storage policies; the content-hash migration adds per-user duplicate protection. Ensure the base table and bucket prerequisites are met before applying the ownership policies.

Review the SQL and schema in your own Supabase project before applying migrations. These files are incremental changes, not a complete database bootstrap.

## Run locally

After configuring Supabase:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account, confirm the email if confirmation is enabled, and sign in to reach the dashboard. Add `GEMINI_API_KEY` and restart the development server to enable AI answers. The passage-search feature does not require the Gemini provider.

## Supported documents and limits

| Format | Extension | Extraction |
|---|---|---|
| PDF | `.pdf` | `pdf-parse`; page markers are retained when page-level text is available |
| Word document | `.docx` | Mammoth raw-text extraction |
| Plain text | `.txt` | UTF-8 decoding |

The maximum file size is **10 MiB**. Empty, unsupported, or invalid files are rejected, and an upload with no readable extracted text is not saved. OCR is not implemented, so scanned/image-only documents may not provide searchable text.

## API routes

| Method and route | Purpose |
|---|---|
| `GET /api/documents` | List the signed-in user's documents; supports the implemented list search and pagination parameters. |
| `POST /api/documents` | Validate, extract, and store a supported file; detects duplicate content for that user. |
| `DELETE /api/documents/[id]` | Delete an owned document and its stored file. |
| `POST /api/documents/[id]/search` | Search an owned document's extracted text and return ranked passages. |
| `POST /api/documents/[id]/answer` | Retrieve evidence and request a grounded Gemini answer for an owned document. |
| `GET /auth/callback` | Exchange an authentication callback code and continue to the dashboard or password-reset flow. |

All document API routes require an authenticated user and scope document access to that user.

## Tests and offline evaluation

Run the focused retrieval and evaluation tests:

```powershell
node --experimental-strip-types --test lib/documents/retrieval.test.mjs lib/documents/evaluation/evaluation.test.mjs
```

The latest run of this command passed **52/52 tests**. The deterministic offline evaluation can be run with:

```powershell
node --experimental-strip-types lib/documents/evaluation/run-evaluation.mjs
```

| Offline fixture set | Cases passed | Evidence retrieved in top 1 / top 3 / top 6 | Answer facts supported |
|---|---:|---:|---:|
| Original | 40/40 | 31/40 / 40/40 / 40/40 | 43/43 |
| Expanded | 49/49 | 38/51 / 50/51 / 51/51 | 54/54 |

These are deterministic local retrieval and annotated evidence-support results on synthetic fixtures. They are **not** live Gemini answer-accuracy results, production measurements, or end-to-end testing against a deployed application.

A large-document performance harness is present, but its performance validation is paused and is not reported as complete.

## Current limitations and remaining work

- The repository does not include the initial `public.documents` schema migration; a compatible base table and Storage bucket must be provisioned before setup migrations can be applied.
- Scanned/image-only documents are not OCR-processed.
- AI answers depend on a configured Gemini API key and network access. Live provider testing is not confirmed.
- The offline evaluation tests retrieval and annotated support, not generated Gemini responses or the complete hosted application.
- Large-document performance testing is not complete.
- Persistent chat history, deployment configuration, and product screenshots are not currently provided.

## Future improvements

- Add a reproducible baseline database/schema migration and a documented Supabase bootstrap flow.
- Add OCR support for scanned documents.
- Expand integration and end-to-end tests, including separately controlled live-provider checks.
- Complete and publish repeatable large-document performance measurements.
- Add genuine application screenshots and, when available, verified deployment information.
- Implement persistent question/answer history if it remains in product scope.

## License

No `LICENSE` file is currently included, so no reuse or distribution license is specified.
