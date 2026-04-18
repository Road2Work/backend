import Joi from 'joi';

export const jobRoleIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Job Role ID is required',
    'any.required': 'Job Role ID is required',
  }),
});
