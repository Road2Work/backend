import Joi from 'joi';

export const startInterviewSchema = Joi.object({
  jobRoleId: Joi.string().required().messages({
    'string.empty': 'Job Role ID is required',
    'any.required': 'Job Role ID is required',
  }),
});

export const interviewIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Interview ID is required',
    'any.required': 'Interview ID is required',
  }),
});

export const sessionParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Interview ID is required',
    'any.required': 'Interview ID is required',
  }),
  sessionId: Joi.string().required().messages({
    'string.empty': 'Session ID is required',
    'any.required': 'Session ID is required',
  }),
});

export const submitSessionSchema = Joi.object({
  transcript: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('ai', 'user').required(),
      content: Joi.string().required(),
      timestamp: Joi.string().optional(),
    })
  ).required().messages({
    'array.base': 'Transcript must be an array',
    'any.required': 'Transcript is required',
  }),
});

export interface StartInterviewInput {
  jobRoleId: string;
}

export interface TranscriptEntry {
  role: 'ai' | 'user';
  content: string;
  timestamp?: string;
}

export interface SubmitSessionInput {
  transcript: TranscriptEntry[];
}
