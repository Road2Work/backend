import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync.ts';
import response from '../../utils/response.ts';
import ApiError from '../../utils/ApiError.ts';
import { getDashboard, refreshDashboard } from './dashboard.service.ts';

export const getDashboardHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const result = await getDashboard(userId);

  if ('error' in result) {
    return next(new ApiError(result.message, 404, result.error));
  }

  return response(res, 200, 'Career readiness dashboard fetched successfully', result);
});

export const refreshDashboardHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const result = await refreshDashboard(userId);

  if ('error' in result) {
    return next(new ApiError(result.message, 404, result.error));
  }

  return response(res, 200, 'Dashboard refreshed successfully', result);
});

export const downloadSummaryHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const dashboardData = await getDashboard(userId);

  if ('error' in dashboardData) {
    return next(new ApiError(dashboardData.message, 404, dashboardData.error));
  }

  const latestScore = dashboardData.dashboard.latestResult?.finalScore || 0;
  if (latestScore < 90) {
    return next(new ApiError('Career summary is locked. Minimum score 90 required.', 403, 'CAREER_SUMMARY_LOCKED'));
  }

  const { generateDashboardSummary } = await import('../interview/ai.service.ts');
  const summaryResult = await generateDashboardSummary({
    dashboard_data: dashboardData.dashboard,
    final_score: latestScore,
  });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="career-summary.txt"');
  return res.send(summaryResult.career_summary);
});
