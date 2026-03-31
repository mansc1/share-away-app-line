const SESSION_KEY = "line_session_token";
const SESSION_EVENT = "line-session-changed";

export const getStoredSessionToken = () => localStorage.getItem(SESSION_KEY);

export const persistSessionToken = (token: string) => {
  localStorage.setItem(SESSION_KEY, token);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
};

export const clearStoredSessionToken = () => {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
};

export const subscribeToSessionChanges = (listener: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) listener();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(SESSION_EVENT, listener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SESSION_EVENT, listener);
  };
};
