import Joi from 'joi';

export const createProfileSchema = Joi.object({
  targetRoleId: Joi.string().required().messages({
    'string.empty': 'Target Role ID is required',
    'any.required': 'Target Role ID is required',
  }),
});

export const profileIdParamSchema = Joi.object({
  profileId: Joi.string().required().messages({
    'string.empty': 'Profile ID is required',
    'any.required': 'Profile ID is required',
  }),
});

export const submitShortProfileSchema = Joi.object({
  mostRelevantExperience: Joi.string().required().messages({
    'string.empty': 'Most relevant experience is required',
    'any.required': 'Most relevant experience is required',
  }),
  skillsAndTools: Joi.string().required().messages({
    'string.empty': 'Skills and tools are required',
    'any.required': 'Skills and tools are required',
  }),
  projectExperience: Joi.string().optional().allow(''),
  achievementOrImpact: Joi.string().optional().allow(''),
});

export interface CreateProfileInput {
  targetRoleId: string;
}

export interface ShortProfileInput {
  mostRelevantExperience: string;
  skillsAndTools: string;
  projectExperience?: string;
  achievementOrImpact?: string;
}
