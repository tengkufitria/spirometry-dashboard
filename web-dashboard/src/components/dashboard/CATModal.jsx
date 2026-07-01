import React, { useState } from 'react';
import { API_BASE_URL } from '../../api/config';

const questions = [
  { left: "I never cough", right: "I cough all the time" },
  { left: "I have no phlegm (mucus) in my chest at all", right: "My chest is completely full of phlegm (mucus)" },
  { left: "My chest does not feel tight at all", right: "My chest feels very tight" },
  { left: "When I walk up a hill or one flight of stairs I am not breathless", right: "When I walk up a hill or one flight of stairs I am very breathless" },
  { left: "I am not limited doing any activities at home", right: "I am very limited doing activities at home" },
  { left: "I am confident leaving my home despite my lung condition", right: "I am not at all confident leaving my home because of my lung condition" },
  { left: "I sleep soundly", right: "I don't sleep soundly because of my lung condition" },
  { left: "I have lots of energy", right: "I have no energy at all" }
];

export default function CATModal({ isOpen, onClose }) {
  const [patientName, setPatientName] = useState('');
  const [scores, setScores] = useState(Array(8).fill(null));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const totalScore = scores.reduce((acc, val) => acc + (val || 0), 0);
  const isComplete = scores.every(s => s !== null) && patientName.trim().length > 0;

  const handleScore = (qIndex, score) => {
    const newScores = [...scores];
    newScores[qIndex] = score;
    setScores(newScores);
  };

  const handleSubmit = async () => {
    if (!isComplete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "dummy_token";
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          name: patientName.trim(),
          catScore: totalScore, 
          catDetails: scores 
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setScores(Array(8).fill(null));
          setPatientName('');
          onClose();
        }, 3000);
      } else {
        console.error("Failed to save CAT");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface-dark w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-surface-container-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">COPD Assessment Test (CAT)</h2>
              <p className="text-xs text-muted font-medium mt-0.5">Measure the impact of COPD on patient wellbeing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">CAT Saved Successfully!</h3>
                <p className="text-muted mt-2 max-w-md mx-auto">
                  The assessment data is now in pending state. It will be automatically linked to the next patient registered on the LCD device.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30">
                <p className="text-sm text-pink-800 dark:text-pink-300">
                  For each item below, select the number that best describes the patient currently. Be sure to only select one response for each question.
                </p>
              </div>

              <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Patient Name (Required for Linking)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                  <input 
                    type="text" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient's full name to link CAT score..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800/50 transition-colors">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      
                      <div className="flex-1 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {q.left}
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        {[0, 1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            onClick={() => handleScore(qIndex, score)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition-all transform hover:scale-110 flex items-center justify-center
                              ${scores[qIndex] === score 
                                ? 'bg-gradient-to-br from-emerald-500 to-pink-500 text-white shadow-md shadow-pink-500/30 scale-110' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-600'}`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {q.right}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-container-dark flex justify-between items-center">
            <div className="flex items-center gap-4 bg-white dark:bg-surface-dark px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-sm font-bold text-muted uppercase tracking-wider">Total Score</span>
              <span className={`text-3xl font-black ${totalScore > 20 ? 'text-rose-500' : totalScore > 10 ? 'text-amber-500' : 'text-green-500'}`}>
                {totalScore}
              </span>
              <span className="text-xs font-semibold text-muted bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                / 40
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isComplete || loading}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                ${!isComplete || loading
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-500 to-pink-500 hover:from-emerald-600 hover:to-pink-600 text-white shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-0.5'
                }`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Save Assessment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
