import { ALLOWED_USERS } from "config";
import { DtoAllowedUserEmail, IAllowedUserEmail } from "models/mongodb/allowed_user_emails"
import { DtoUser } from "models/mongodb/users";
import { LOGGER } from "services/loggers";

export const setupAllowedUsers = () => {
    LOGGER.debug(`Adding allowed user emails ${JSON.stringify(ALLOWED_USERS)}`);
    DtoAllowedUserEmail.deleteMany({ email: { $nin: ALLOWED_USERS } }).exec();
    ALLOWED_USERS.forEach(email => {
        DtoAllowedUserEmail.findOne({ email })
            .then(foundEntry => handleResponse(foundEntry, email))
            .catch(err => {
                LOGGER.error(err.message);
                throw err;
            })
    });
}

const handleResponse = (foundEntry: IAllowedUserEmail | null, email: string) => {
    if (foundEntry) return;
    LOGGER.debug(`Adding allowed user email ${email}`);
    const newMail = new DtoAllowedUserEmail({
        email
    })
    return newMail.save();
}

export const removeUnauthorizedUsers = () => {
    LOGGER.debug(`Remove unauthorized users from the DB`);
    DtoUser.deleteMany({ email: { $nin: ALLOWED_USERS } }).exec();
}