import { Document, model, Schema } from 'mongoose';

export interface IAllowedUserEmail extends Document {
  email: string;
}

const AllowedUserEmail = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

export const DtoAllowedUserEmail = model('allowed_user_email', AllowedUserEmail);
