import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../DatabaseContext';
import { Button } from '../shared/Button';
import { BasicInfoForm } from './BasicInfoForm';
import { ChordEditor } from './ChordEditor';
import { SectionMarkerBuilder } from './SectionMarkerBuilder';
import { YouTubeCurator } from '../YouTubeCurator/YouTubeCurator';
import { YouTubeBackingCurator } from '../YouTubeBackingCurator/YouTubeBackingCurator';
import { SpotifyCurator } from '../SpotifyCurator/SpotifyCurator';
import { Validation } from './Validation';
import { PreviewPanel } from './PreviewPanel';

export const TuneEditor = () => {
  const { tuneId } = useParams();
  const navigate = useNavigate();
  const { getTune, updateTune } = useDatabase();

  const [tune, setTune] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    const loadedTune = getTune(tuneId);
    if (loadedTune) {
      setTune({ ...loadedTune });
    } else {
      alert('Tune not found');
      navigate('/');
    }
  }, [tuneId, getTune, navigate]);

  const handleFieldChange = (field, value) => {
    setTune(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateTune(tuneId, tune);
    setHasChanges(false);
    alert('Tune saved successfully!');
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  if (!tune) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleCancel}>
                ← Back to List
              </Button>
              <h1 className="text-xl font-bold text-gray-900">
                {tune.tune_name || 'Untitled Tune'}
              </h1>
              {hasChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  • Unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Split-screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-80px)]">
        {/* Left Panel - Edit */}
        <div className="bg-white border-r border-gray-200 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit</h2>

          {/* Section tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveSection('basic')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'basic'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveSection('chords')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'chords'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Chord Chart
            </button>
            <button
              onClick={() => setActiveSection('sections')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'sections'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveSection('youtube')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'youtube'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              YouTube Tunes
            </button>
            <button
              onClick={() => setActiveSection('youtube-backing')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'youtube-backing'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              YouTube Backing
            </button>
            <button
              onClick={() => setActiveSection('spotify')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'spotify'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Spotify
            </button>
            <button
              onClick={() => setActiveSection('validation')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeSection === 'validation'
                  ? 'border-jazz-blue text-jazz-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Validation
            </button>
          </div>

          {/* Section content */}
          <div>
            {activeSection === 'basic' && (
              <BasicInfoForm tune={tune} onChange={handleFieldChange} />
            )}

            {activeSection === 'chords' && (
              <ChordEditor
                chords={tune.chords || ''}
                chordProgressionNotes={tune.chord_progression_notes || ''}
                onChordsChange={(value) => handleFieldChange('chords', value)}
                onNotesChange={(value) => handleFieldChange('chord_progression_notes', value)}
              />
            )}

            {activeSection === 'sections' && (
              <SectionMarkerBuilder
                chords={tune.chords || ''}
                form={tune.form || ''}
                sectionMarkers={tune.section_markers || []}
                onChange={(value) => handleFieldChange('section_markers', value)}
              />
            )}

            {activeSection === 'youtube' && (
              <YouTubeCurator
                videoIds={tune.youtube_video_ids || []}
                tuneName={tune.tune_name}
                famousRecordings={tune.famous_recordings || []}
                onChange={(value) => handleFieldChange('youtube_video_ids', value)}
              />
            )}

            {activeSection === 'youtube-backing' && (
              <YouTubeBackingCurator
                videoIds={tune.youtube_backing_track_ids || []}
                tuneName={tune.tune_name}
                onChange={(value) => handleFieldChange('youtube_backing_track_ids', value)}
              />
            )}

            {activeSection === 'spotify' && (
              <SpotifyCurator
                playlistId={tune.spotify_playlist_id || null}
                tuneName={tune.tune_name}
                onChange={(value) => handleFieldChange('spotify_playlist_id', value)}
              />
            )}

            {activeSection === 'validation' && (
              <Validation
                tune={tune}
                validated={tune.validated || false}
                onChange={(value) => handleFieldChange('validated', value)}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="bg-gray-50 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <PreviewPanel tune={tune} />
        </div>
      </div>
    </div>
  );
};
