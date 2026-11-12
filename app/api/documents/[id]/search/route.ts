import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  hasSpecificSearchTerms,
  retrieveRelevantPassages,
} from "@/lib/documents/retrieval";
import {
  questionRequestError,
  readQuestionRequest,
} from "@/lib/documents/request-body";

const MAX_QUESTION_LENGTH = 500;
const MAX_REQUEST_SIZE = 16 * 1024;
const MAX_PASSAGE_LENGTH = 800;
const MAX_RESULTS = 3;

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/documents/[id]/search">,
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Your session expired. Log in before searching documents." },
      { status: 401 },
    );
  }

  const parsedRequest = await readQuestionRequest(request, MAX_REQUEST_SIZE);
  if (!parsedRequest.ok) {
    const requestError = questionRequestError(parsedRequest.reason, "search");
    return NextResponse.json(
      { error: requestError.message },
      { status: requestError.status },
    );
  }
  const body = parsedRequest.body;

  const question =
    typeof body === "object" && body !== null && "question" in body
      ? body.question
      : null;

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "Enter a question or search phrase." },
      { status: 400 },
    );
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Search text must be ${MAX_QUESTION_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (documentError) {
    return NextResponse.json(
      { error: "This document couldn’t be searched. Please try again." },
      { status: 500 },
    );
  }

  if (!document) {
    return NextResponse.json(
      { error: "Document not found." },
      { status: 404 },
    );
  }

  if (!hasSpecificSearchTerms(question)) {
    return NextResponse.json(
      { error: "Use at least one specific search term." },
      { status: 400 },
    );
  }

  const results = retrieveRelevantPassages(document.extracted_text, question, {
    maxResults: MAX_RESULTS,
    maxPassageLength: MAX_PASSAGE_LENGTH,
    maxContextLength: MAX_RESULTS * MAX_PASSAGE_LENGTH,
  }).map(({ id, passage, sectionTitle, pageNumber, matchedTerms, totalTerms }) => ({
    id,
    passage,
    sectionTitle,
    pageNumber,
    matchedTerms,
    totalTerms,
  }));

  return NextResponse.json({ results });
}
