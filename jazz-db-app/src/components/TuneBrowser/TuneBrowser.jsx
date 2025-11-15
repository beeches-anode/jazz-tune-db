import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { getTuneCompletionStatus } from '../../utils/validation';
import { Button } from '../shared/Button';
import { FileUpload } from '../shared/FileUpload';

export const TuneBrowser = () => {
  const { tunes, loadDatabase, exportDatabase } = useDatabase();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterKey, setFilterKey] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [showOnlyNoYouTube, setShowOnlyNoYouTube] = useState(false);

  // Get unique styles and keys from database
  const styles = useMemo(() => {
    if (!tunes) return [];
    const uniqueStyles = [...new Set(tunes.map(t => t.style).filter(Boolean))];
    return uniqueStyles.sort();
  }, [tunes]);

  const keys = useMemo(() => {
    if (!tunes) return [];
    const uniqueKeys = [...new Set(tunes.map(t => t.standard_key).filter(Boolean))];
    return uniqueKeys.sort();
  }, [tunes]);

  // Filter and sort tunes
  const filteredTunes = useMemo(() => {
    if (!tunes) return [];

    let filtered = tunes;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tune =>
        tune.tune_name?.toLowerCase().includes(term) ||
        tune.composer?.toLowerCase().includes(term) ||
        tune.lyricist?.toLowerCase().includes(term)
      );
    }

    // Style filter
    if (filterStyle !== 'all') {
      filtered = filtered.filter(tune => tune.style === filterStyle);
    }

    // Key filter
    if (filterKey !== 'all') {
      filtered = filtered.filter(tune => tune.standard_key === filterKey);
    }

    // Incomplete filter
    if (showOnlyIncomplete) {
      filtered = filtered.filter(tune => {
        const status = getTuneCompletionStatus(tune);
        return status.status !== 'complete';
      });
    }

    // No YouTube filter
    if (showOnlyNoYouTube) {
      filtered = filtered.filter(tune =>
        !tune.youtube_video_ids || tune.youtube_video_ids.length === 0
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.tune_name || '').localeCompare(b.tune_name || '');
        case 'rank':
          return (a.rank || 999) - (b.rank || 999);
        case 'year':
          return (a.year || 0) - (b.year || 0);
        case 'completion':
          const statusA = getTuneCompletionStatus(a);
          const statusB = getTuneCompletionStatus(b);
          return statusA.score - statusB.score;
        default:
          return 0;
      }
    });

    return filtered;
  }, [tunes, searchTerm, filterStyle, filterKey, sortBy, showOnlyIncomplete, showOnlyNoYouTube]);

  const handleFileLoad = (data) => {
    const result = loadDatabase(data);
    if (result.success) {
      alert(`Successfully loaded ${result.count || 0} tunes!`);
    } else {
      alert(`Error loading database: ${result.error}`);
    }
  };

  if (!tunes) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-jazz-blue mb-6">Jazz DB Manager</h1>
          <p className="text-gray-600 mb-8">No database loaded. Please import your jazz-tunes-jpp.json file.</p>
          <FileUpload onFileLoad={handleFileLoad} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-jazz-blue">Jazz DB Manager</h1>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <FileUpload onFileLoad={handleFileLoad} />
              <Button variant="primary" onClick={exportDatabase}>
                Export JSON
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search tunes, composers, lyricists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
            >
              <option value="all">All Styles</option>
              {styles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>

            <select
              value={filterKey}
              onChange={(e) => setFilterKey(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
            >
              <option value="all">All Keys</option>
              {keys.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
            >
              <option value="name">Sort: Name</option>
              <option value="rank">Sort: Rank</option>
              <option value="year">Sort: Year</option>
              <option value="completion">Sort: Completion</option>
            </select>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyIncomplete}
                  onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
                  className="w-4 h-4 text-jazz-blue rounded focus:ring-jazz-blue"
                />
                <span className="text-sm text-gray-700">Incomplete</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyNoYouTube}
                  onChange={(e) => setShowOnlyNoYouTube(e.target.checked)}
                  className="w-4 h-4 text-jazz-blue rounded focus:ring-jazz-blue"
                />
                <span className="text-sm text-gray-700">No Videos</span>
              </label>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredTunes.length} of {tunes.length} tunes
          </div>
        </div>
      </div>

      {/* Tune List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Composer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Style
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Videos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTunes.map((tune) => {
                const status = getTuneCompletionStatus(tune);
                const videoCount = tune.youtube_video_ids?.length || 0;

                return (
                  <tr
                    key={tune.id}
                    onClick={() => navigate(`/tune/${tune.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tune.rank || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tune.tune_name || 'Untitled'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{tune.composer || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{tune.year || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{tune.style || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium status-${status.status}`}>
                        {status.icon} {status.score}/{status.maxScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${videoCount >= 5 ? 'text-green-600' : videoCount > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {videoCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTunes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No tunes found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
