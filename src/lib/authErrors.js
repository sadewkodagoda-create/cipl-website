export const TEMPORARY_AUTH_ERROR =
  "The authentication server is temporarily unavailable. Please try again shortly.";

const NETWORK_ERROR_PATTERN =
  /failed to fetch|fetch failed|network|load failed|timeout|timed out|aborted|connection/i;

export function getAuthErrorMessage(error) {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : error?.message;

  if (!message || NETWORK_ERROR_PATTERN.test(message)) {
    return TEMPORARY_AUTH_ERROR;
  }

  return message;
}
