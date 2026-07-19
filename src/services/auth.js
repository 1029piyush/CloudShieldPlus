import api from "./api";

/**
 * Sends the Google ID Token to the Flask backend for verification.
 * Returns the CloudIntercept JWT and user profile.
 */
export const authenticateWithGoogle = async (idToken) => {
    const response = await api.post("/auth/google", { id_token: idToken });
    return response.data;
};
