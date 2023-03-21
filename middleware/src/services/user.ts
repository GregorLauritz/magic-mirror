import { GoogleUser } from "../models/express_user";

export const getEmail = async (user?: GoogleUser): Promise<string> => {
    if (user?.email) {
        return user.email;
    }
    throw Object.assign(
        new Error(`User has no email address defined!`),
    );
}

export const getAccessToken = async (user?: GoogleUser): Promise<string> => {
    if (user?.access_token) {
        return user.access_token;
    }
    throw Object.assign(
        new Error(`User has no access_token defined!`),
    );
}

export const getRefreshToken = async (user?: GoogleUser): Promise<string> => {
    if (user?.refresh_token) {
        return user.refresh_token;
    }
    throw Object.assign(
        new Error(`User has no refresh_token defined!`),
    );
}
