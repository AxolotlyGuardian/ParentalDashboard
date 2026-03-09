'use client';

import { useState, useEffect } from 'react';
import { npsApi } from '@/lib/api';

interface NPSSurveyModalProps {
  onClose: () => void;
}

export default function NPSSurveyModal({ onClose }: NPSSurveyModalProps) {
  const [surveyId, setSurveyId] = useState<number | null>(null);
  const [triggerDay, setTriggerDay] = useState<number>(0);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSurvey();
  }, []);

  const checkSurvey = async () => {
    try {
      const res = await npsApi.check();
      if (res.data.survey_due) {
        setSurveyId(res.data.survey_id);
        setTriggerDay(res.data.trigger_day);
      } else {
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (surveyId === null || score === null) return;
    try {
      await npsApi.submit(surveyId, score, comment || undefined);
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch {
      // silently fail
    }
  };

  const handleDismiss = async () => {
    if (surveyId !== null) {
      try {
        await npsApi.dismiss(surveyId);
      } catch {
        // silent
      }
    }
    onClose();
  };

  if (loading || surveyId === null) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">&#10003;</div>
            <h2 className="text-xl font-bold text-[#566886] mb-2">Thank you!</h2>
            <p className="text-gray-500">Your feedback helps us build a better product for families.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#566886] mb-1">
                How likely are you to recommend Axolotly?
              </h2>
              <p className="text-sm text-gray-500">
                You&apos;ve been with us for {triggerDay} days. We&apos;d love your feedback!
              </p>
            </div>

            {/* Score selector */}
            <div className="mb-4">
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`h-10 rounded-lg text-sm font-bold transition-all ${
                      score === i
                        ? i <= 6
                          ? 'bg-red-500 text-white scale-110'
                          : i <= 8
                          ? 'bg-yellow-500 text-white scale-110'
                          : 'bg-green-500 text-white scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-5">
              <textarea
                placeholder="Any comments? (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/30"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-500 text-sm hover:bg-gray-50 transition"
              >
                Maybe later
              </button>
              <button
                onClick={handleSubmit}
                disabled={score === null}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-40 transition"
                style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
