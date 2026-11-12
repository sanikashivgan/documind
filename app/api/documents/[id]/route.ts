import { NextResponse, type NextRequest } from "next/server";
import { deleteOwnedDocument } from "@/lib/documents/delete-document";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext<"/api/documents/[id]">,
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Your session expired. Log in before deleting documents." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const result = await deleteOwnedDocument({
    documentId: id,
    userId: user.id,
    async findOwnedDocument(documentId, userId) {
      const { data, error } = await supabase
        .from("documents")
        .select("id, storage_path")
        .eq("id", documentId)
        .eq("user_id", userId)
        .maybeSingle();

      return {
        document: data ? { storagePath: data.storage_path } : null,
        error: Boolean(error),
      };
    },
    async removeStorageFile(path) {
      const { error } = await supabase.storage
        .from("documents")
        .remove([path]);
      return { error: Boolean(error) };
    },
    async deleteOwnedRecord(documentId, userId) {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      return { error: Boolean(error) };
    },
  });

  if (result.type !== "success") {
    const errors = {
      "lookup-error": {
        message: "The document could not be checked for deletion. Please retry.",
        log: "Document deletion lookup failed.",
      },
      "invalid-storage-path": {
        message: "The document file could not be verified for deletion.",
        log: "Document deletion stopped: invalid owned storage path.",
      },
      "storage-error": {
        message: "The document file could not be deleted. Its record was kept; please retry.",
        log: "Document Storage deletion failed.",
      },
      "database-error": {
        message: "The file was deleted, but its record remains. Please retry the deletion.",
        log: "Document database deletion failed after Storage removal.",
      },
    } as const;
    const { message, log } = errors[result.type];
    console.error(log);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ message: "Document deleted successfully." });
}
