export type LogoutResult = { success: true } | { success: false };

export async function attemptLogout(
  signOut: () => Promise<{ error: unknown | null }>,
): Promise<LogoutResult> {
  try {
    const { error } = await signOut();
    return error ? { success: false } : { success: true };
  } catch {
    return { success: false };
  }
}
