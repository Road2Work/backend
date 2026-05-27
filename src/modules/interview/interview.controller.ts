import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import {
  createSession,
  getSessionDetail,
  submitVoiceAnswer,
  cancelSession,
  getSessionResult,
  getInterviewHistory,
  getQuota,
  getPracticeMemory,
} from './interview.service.ts';

export const createSessionHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const result = await createSession(userId, req.body);

  if ('error' in result && result.error) {
    const statusMap: Record<string, number> = {
      PROFILE_NOT_FOUND: 404,
      ROLE_NOT_FOUND: 404,
      INTERVIEW_CONTEXT_REQUIRED: 400,
      INTERVIEW_QUOTA_EXCEEDED: 403,
    };
    const status = statusMap[result.error] || 400;
    return next(new ApiError(result.message, status, result.error));
  }

  return response(res, 201, 'Interview session created successfully', result);
});

export const getSessionDetailHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const sessionId = req.params.sessionId as string;

  const result = await getSessionDetail(sessionId, userId);

  if (!result) {
    return next(ApiError.notFound('Interview session not found', 'INTERVIEW_SESSION_NOT_FOUND'));
  }

  return response(res, 200, 'Interview session fetched successfully', result);
});

export const submitVoiceAnswerHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const sessionId = req.params.sessionId as string;
  const { questionId } = req.body;

  if (!questionId) {
    return next(ApiError.badRequest('Question ID is required'));
  }

  if (!req.file) {
    return next(ApiError.badRequest('Audio file is required', 'AUDIO_INVALID_FORMAT'));
  }

  const allowedMimes = [
    'audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg',
    'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/ogg',
  ];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return next(ApiError.badRequest('Invalid audio format. Allowed: webm, wav, mp3, m4a', 'AUDIO_INVALID_FORMAT'));
  }

  const maxSize = 10 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return next(ApiError.badRequest('Audio file is too large', 'AUDIO_FILE_TOO_LARGE'));
  }

  const result = await submitVoiceAnswer(
    sessionId,
    userId,
    questionId,
    req.file.path,
    req.file.originalname,
    req.file.mimetype,
  );

  if ('error' in result) {
    const statusMap: Record<string, number> = {
      INTERVIEW_SESSION_NOT_FOUND: 404,
      INTERVIEW_ALREADY_COMPLETED: 400,
    };
    const status = statusMap[result.error] || 400;
    return next(new ApiError(result.message, status, result.error));
  }

  const message = result.isCompleted
    ? 'Interview completed successfully'
    : result.nextQuestion?.questionType === 'clarification'
      ? 'Answer evaluated. Clarification needed.'
      : 'Answer evaluated successfully';

  return response(res, 200, message, result);
});

export const cancelSessionHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const sessionId = req.params.sessionId as string;

  const result = await cancelSession(sessionId, userId);

  if (!result) {
    return next(ApiError.notFound('Interview session not found', 'INTERVIEW_SESSION_NOT_FOUND'));
  }

  if ('error' in result) {
    return next(ApiError.badRequest(result.message, result.error));
  }

  return response(res, 200, 'Interview session cancelled successfully', result);
});

export const getResultHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const sessionId = req.params.sessionId as string;

  const result = await getSessionResult(sessionId, userId);

  if ('error' in result) {
    const statusMap: Record<string, number> = {
      INTERVIEW_SESSION_NOT_FOUND: 404,
      RESULT_NOT_FOUND: 404,
    };
    const status = statusMap[result.error] || 404;
    return next(new ApiError(result.message, status, result.error));
  }

  return response(res, 200, 'Interview result fetched successfully', result);
});

export const getHistoryHandler = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user?.id as string;
  const result = await getInterviewHistory(userId);
  return response(res, 200, 'Interview history fetched successfully', result);
});

export const getQuotaHandler = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user?.id as string;
  const result = await getQuota(userId);
  return response(res, 200, 'Interview quota fetched successfully', result);
});

export const getPracticeMemoryHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const roleId = req.query.roleId as string;

  if (!roleId) return next(ApiError.badRequest('roleId query parameter is required'));

  const result = await getPracticeMemory(userId, roleId);

  if ('error' in result) {
    return next(new ApiError(result.message, 404, result.error));
  }

  return response(res, 200, 'Practice memory fetched successfully', result);
});
