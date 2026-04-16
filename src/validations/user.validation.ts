import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  role: Joi.string().trim().required().messages({
    'string.empty': 'Role is required',
    'any.required': 'Role is required',
  }),
});

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: string;
}
