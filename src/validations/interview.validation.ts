import Joi from 'joi';

export const createSessionSchema = Joi.object({
  profileId: Joi.string().required().messages({
    'string.empty': 'Profile ID is required',
    'any.required': 'Profile ID is required',
  }),
  roleId: Joi.string().required().messages({
    'string.empty': 'Role ID is required',
    'any.required': 'Role ID is required',
  }),
  totalMainQuestions: Joi.number().integer().min(1).max(10).default(5).messages({
    'number.min': 'Must have at least 1 question',
    'number.max': 'Cannot exceed 10 questions',
  }),
  practiceMode: Joi.string()
    .valid('first_session', 'adaptive_from_history', 'retry_focus')
    .default('first_session'),
  retryMode: Joi.boolean().default(false),
  avoidRepeatedQuestions: Joi.boolean().default(true),
  improvementFocus: Joi.array().items(Joi.string()).default([]),
  requestedCompetencies: Joi.array().items(Joi.string()).default([]),
});

export const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.empty': 'Session ID is required',
    'any.required': 'Session ID is required',
  }),
});

export const voiceAnswerFieldsSchema = Joi.object({
  questionId: Joi.string().required().messages({
    'string.empty': 'Question ID is required',
    'any.required': 'Question ID is required',
  }),
});

export interface CreateSessionInput {
  profileId: string;
  roleId: string;
  totalMainQuestions?: number;
  practiceMode?: 'first_session' | 'adaptive_from_history' | 'retry_focus';
  retryMode?: boolean;
  avoidRepeatedQuestions?: boolean;
  improvementFocus?: string[];
  requestedCompetencies?: string[];
}

export interface VoiceAnswerFields {
  questionId: string;
}

