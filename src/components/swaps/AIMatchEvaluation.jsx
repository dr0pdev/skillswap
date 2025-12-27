export default function AIMatchEvaluation({ evaluation }) {
  if (evaluation.loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Evaluating match...</p>
        </div>
      </div>
    )
  }

  if (evaluation.error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
        <p className="text-red-700">⚠️ {evaluation.error}</p>
      </div>
    )
  }

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'Strong':
        return 'text-green-600'
      case 'Moderate':
        return 'text-yellow-600'
      case 'Weak':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getFeasibilityColor = (feasibility) => {
    if (feasibility === 'Feasible') return 'text-green-600'
    if (feasibility === 'Feasible with concerns') return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStrengthBars = (strength) => {
    const count = strength === 'Strong' ? 5 : strength === 'Moderate' ? 3 : 1
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className={`h-2 w-full rounded ${
            i < count ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        />
      ))
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🤖 AI Match Evaluation
      </h3>

      {/* Match Strength */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Match Strength:
          </span>
          <span
            className={`text-sm font-bold ${getStrengthColor(
              evaluation.matchStrength
            )}`}
          >
            {evaluation.matchStrength}
          </span>
        </div>
        <div className="flex gap-1">{getStrengthBars(evaluation.matchStrength)}</div>
      </div>

      {/* Feasibility */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Feasibility:
          </span>
          <span
            className={`text-sm font-bold ${getFeasibilityColor(
              evaluation.feasibility
            )}`}
          >
            {evaluation.feasibility === 'Feasible' ? '✓' : '⚠️'}{' '}
            {evaluation.feasibility}
          </span>
        </div>
      </div>

      {/* Fairness Score */}
      {evaluation.fairnessScore !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Fairness Score:
            </span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round(evaluation.fairnessScore)}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${evaluation.fairnessScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Explanation Points */}
      {evaluation.explanation && evaluation.explanation.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Analysis:</p>
          <ul className="space-y-2">
            {evaluation.explanation.map((point, index) => {
              const icon =
                point.type === 'success'
                  ? '✓'
                  : point.type === 'warning'
                  ? '⚠️'
                  : '✗'
              const color =
                point.type === 'success'
                  ? 'text-green-700'
                  : point.type === 'warning'
                  ? 'text-yellow-700'
                  : 'text-red-700'

              return (
                <li key={index} className={`flex items-start gap-2 text-sm ${color}`}>
                  <span className="flex-shrink-0">{icon}</span>
                  <span>{point.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Advisory Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Note:</strong> This is advisory only. You can proceed
          regardless of the evaluation. The AI provides guidance, but the
          decision is yours.
        </p>
      </div>
    </div>
  )
}

