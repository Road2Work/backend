import type { TranscriptEntry } from '../../validations/interview.validation.ts';

/**
 * AI Assessment result structure.
 * This interface defines the contract between our backend and the AI service.
 * When the AI team's API is ready, only the implementation of `evaluateInterview`
 * needs to change — not the interface.
 */
export interface AiAssessmentResult {
  overallScore: number; // 0-100
  categories: {
    relevance: number; // 0-100
    structure: number; // 0-100
    depth: number; // 0-100
    communication: number; // 0-100
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    summary: string;
  };
}

/**
 * Evaluate an interview session using AI.
 *
 * Currently returns MOCK data for development/testing.
 * When the AI team's API is ready, replace the implementation below
 * with an HTTP call to their service.
 *
 * Example future implementation:
 * ```ts
 * const response = await fetch(env.AI_API_URL + '/evaluate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.AI_API_KEY}` },
 *   body: JSON.stringify({ transcript, stageType }),
 * });
 * return response.json();
 * ```
 */
export const evaluateInterview = async (
  transcript: TranscriptEntry[],
  stageType: string,
): Promise<AiAssessmentResult> => {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const baseScore = Math.min(60 + transcript.length * 2, 95);
  const variance = () => Math.floor(Math.random() * 15) - 5;

  const result: AiAssessmentResult = {
    overallScore: baseScore,
    categories: {
      relevance: Math.min(100, baseScore + variance()),
      structure: Math.min(100, baseScore + variance()),
      depth: Math.min(100, baseScore + variance()),
      communication: Math.min(100, baseScore + variance()),
    },
    feedback: {
      strengths: [
        'Jawaban menunjukkan pemahaman yang baik tentang topik',
        'Penggunaan contoh konkret dalam menjawab',
      ],
      improvements: [
        'Gunakan metode STAR (Situation, Task, Action, Result) untuk menjawab pertanyaan behavioral',
        'Tambahkan data kuantitatif untuk memperkuat jawaban',
      ],
      summary: `[MOCK] Evaluasi untuk sesi ${stageType}: Secara keseluruhan performa cukup baik dengan skor ${baseScore}/100. Kandidat menunjukkan potensi yang baik namun masih ada ruang untuk peningkatan.`,
    },
  };

  return result;
};
