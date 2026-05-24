import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../DatabaseContext';
import { getTuneCompletionStatus } from '../utils/validation';
import { Button } from '../shared/Button';
import { FileUpload } from '../shared/FileUpload';

const DEFAULT_COLUMN_WIDTHS = {
  rank: 80,
  validated: 60,
  name: 200,
  composer: 180,
  year: 80,
  style: 120,
  status: 100,
  videos: 80,
};

export const TuneBrowser = () => {
  const { tunes, loadDatabase, exportDatabase } = useDatabase();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterKey, setFilterKey] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [showOnlyNoYouTube, setShowOnlyNoYouTube] = useState(false);
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('jazz-db-column-widths');
    return saved ? { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) } : DEFAULT_COLUMN_WIDTHS;
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const tableRef = useRef(null);

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

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('jazz-db-column-widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Handle column resizing
  useEffect(() => {
    if (!resizingColumn) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff); // Minimum width of 50px
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const handleResizeStart = (columnKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

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
          <div className="overflow-x-auto" ref={tableRef} style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <table 
              className="divide-y divide-gray-200" 
              style={{ 
                minWidth: Object.values(columnWidths).reduce((sum, w) => sum + w, 0),
                tableLayout: 'fixed',
                width: '100%'
              }}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.rank }}
                  >
                    Rank
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('rank', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.validated }}
                  >
                    ✓
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('validated', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.name }}
                  >
                    Name
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('name', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.composer }}
                  >
                    Composer
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('composer', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.year }}
                  >
                    Year
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('year', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.style }}
                  >
                    Style
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('style', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.status }}
                  >
                    Status
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart('status', e)}
                      style={{ userSelect: 'none' }}
                      title="Drag to resize"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    style={{ width: columnWidths.videos }}
                  >
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
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: columnWidths.rank }}>
                        <div className="text-sm font-medium text-gray-900">
                          {tune.rank || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center" style={{ width: columnWidths.validated }}>
                        {tune.validated ? (
                          <span className="text-green-600 text-lg" title="Validated">
                            ✓
                          </span>
                        ) : (
                          <span className="text-gray-300 text-lg">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: columnWidths.name }}>
                        <div className="text-sm font-medium text-gray-900">
                          {tune.tune_name || 'Untitled'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: columnWidths.composer }}>
                        <div className="text-sm text-gray-700">{tune.composer || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: columnWidths.year }}>
                        <div className="text-sm text-gray-700">{tune.year || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: columnWidths.style }}>
                        <div className="text-sm text-gray-700">{tune.style || '—'}</div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap overflow-visible" style={{ width: columnWidths.status }}>
                      <div className="relative group">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium status-${status.status} cursor-help`}>
                          {status.icon} {status.score}/{status.maxScore}
                        </span>
                        {status.missingItems && status.missingItems.length > 0 && (
                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap min-w-max">
                              <div className="font-semibold mb-1 text-white">Missing:</div>
                              <ul className="list-disc list-inside space-y-0.5 text-gray-200">
                                {status.missingItems.map((item, idx) => (
                                  <li key={idx} className="text-left">{item}</li>
                                ))}
                              </ul>
                              <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: columnWidths.videos }}>
                        <span className={`text-sm ${videoCount >= 5 ? 'text-green-600' : videoCount > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {videoCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
