import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { getDatabaseStats } from '../../utils/validation';
import { Button } from '../shared/Button';

export const Dashboard = () => {
  const { tunes } = useDatabase();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    return getDatabaseStats(tunes);
  }, [tunes]);

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressIcon = (percentage) => {
    if (percentage >= 90) return '✅';
    if (percentage >= 50) return '⚠️';
    return '❌';
  };

  if (!tunes || tunes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No database loaded</h1>
          <Button onClick={() => navigate('/')}>Go to Browser</Button>
        </div>
      </div>
    );
  }

  const { totalTunes, fieldStats, youtubeStats, completionStats } = stats;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-jazz-blue">Data Validation Dashboard</h1>
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Back to Browser
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">
                {completionStats.complete}
              </div>
              <div className="text-sm text-green-700">Complete</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-900">
                {completionStats.partial}
              </div>
              <div className="text-sm text-amber-700">In Progress</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-900">
                {completionStats.incomplete}
              </div>
              <div className="text-sm text-red-700">Not Started</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Total tunes: {totalTunes} | Completion rate:{' '}
            {((completionStats.complete / totalTunes) * 100).toFixed(1)}%
          </div>
        </div>

        {/* Field Completion Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Field Completion Stats</h2>
          <div className="space-y-4">
            {Object.entries(fieldStats).map(([field, data]) => {
              const percentage = parseFloat(data.percentage);
              return (
                <div key={field}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getProgressIcon(percentage)}</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {data.count}/{data.total} ({data.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* YouTube Video Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">YouTube Video Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-900">
                {youtubeStats.noVideos}
              </div>
              <div className="text-sm text-red-700">0 videos</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-900">
                {youtubeStats.fewVideos}
              </div>
              <div className="text-sm text-amber-700">1-4 videos (below target)</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">
                {youtubeStats.targetVideos}
              </div>
              <div className="text-sm text-green-700">5-10 videos ✅</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">
                {youtubeStats.manyVideos}
              </div>
              <div className="text-sm text-blue-700">10+ videos</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/?filter=no-youtube');
                // This would need to be implemented in TuneBrowser
              }}
            >
              Find: No YouTube Videos ({youtubeStats.noVideos})
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/?filter=no-key');
              }}
            >
              Find: Missing Standard Key ({totalTunes - fieldStats.standardKey.count})
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/?filter=no-sections');
              }}
            >
              Find: No Section Markers ({totalTunes - fieldStats.sectionMarkers.count})
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/?filter=incomplete');
              }}
            >
              Find: Incomplete Tunes ({completionStats.incomplete + completionStats.partial})
            </Button>
          </div>
        </div>

        {/* Priority Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Recommendations</h2>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-900 mb-1">
                🎯 Focus on YouTube videos
              </div>
              <div className="text-sm text-blue-800">
                {youtubeStats.noVideos} tunes have no videos yet. Adding 5-10 videos per tune is the
                highest priority task.
              </div>
            </div>

            {fieldStats.sectionMarkers.percentage < 50 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="font-medium text-amber-900 mb-1">
                  ⚠️ Section markers missing
                </div>
                <div className="text-sm text-amber-800">
                  {totalTunes - fieldStats.sectionMarkers.count} tunes need section markers.
                  Use the auto-generate feature for standard forms.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
