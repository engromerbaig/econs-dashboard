import mongoose, { Schema, models, model } from 'mongoose';

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
});

// Avoid recompilation error in Next.js
const User = models.User || model('User', userSchema);

export default User;
