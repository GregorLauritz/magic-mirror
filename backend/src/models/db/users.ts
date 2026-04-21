import { Document, model, Schema } from 'mongoose';

export interface IDtoUser extends Document {
  email: string;
  displayName?: string;
  given_name?: string;
  family_name?: string;
  photo?: string;
  sub: string;
  access_token: string;
  refresh_token: string;
}

const UserSchema = new Schema(
  {
    displayName: {
      type: String,
    },
    given_name: {
      type: String,
    },
    family_name: {
      type: String,
    },
    photo: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    sub: {
      type: String,
      required: true,
      unique: true,
    },
    access_token: {
      type: String,
      required: true,
    },
    refresh_token: {
      type: String,
      required: true,
    },
  },
  { strict: false },
);

export const DtoUser = model('user', UserSchema);
