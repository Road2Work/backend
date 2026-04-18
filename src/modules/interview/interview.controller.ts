import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import {
  startInterview,
  getUserInterviews,
  getInterviewDetail,
  startSession,
  submitSession,
  getInterviewResult,
} from './interview.service.ts';

export const startInterviewHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const { jobRoleId } = req.body;

  const result = await startInterview(userId, jobRoleId);

  if (!result) {
    return next(ApiError.notFound('Job role not found or has no interview stages'));
  }

  return response(res, 201, 'Interview started successfully', result);
});

export const listInterviewsHandler = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user?.id as string;
  const interviews = await getUserInterviews(userId);
  return response(res, 200, 'Interviews fetched successfully', interviews);
});

export const getInterviewDetailHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const id = req.params.id as string;

  const interview = await getInterviewDetail(id, userId);

  if (!interview) {
    return next(ApiError.notFound('Interview not found'));
  }

  return response(res, 200, 'Interview detail fetched successfully', interview);
});

export const startSessionHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const id = req.params.id as string;
  const sessionId = req.params.sessionId as string;

  const result = await startSession(id, sessionId, userId);

  if (!result) {
    return next(ApiError.notFound('Interview or session not found'));
  }

  if ('error' in result) {
    return next(ApiError.badRequest(result.error));
  }

  return response(res, 200, 'Session started successfully', result);
});

export const submitSessionHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const id = req.params.id as string;
  const sessionId = req.params.sessionId as string;
  const { transcript } = req.body;

  const result = await submitSession(id, sessionId, userId, transcript);

  if (!result) {
    return next(ApiError.notFound('Interview or session not found'));
  }

  // if ('error' in result) {
  //   return next(ApiError.badRequest(result.error));
  // }

  return response(res, 200, 'Session submitted and evaluated successfully', result);
});

export const getInterviewResultHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const id = req.params.id as string;

  const result = await getInterviewResult(id, userId);

  if (!result) {
    return next(ApiError.notFound('Interview not found'));
  }

  return response(res, 200, 'Interview result fetched successfully', result);
});
