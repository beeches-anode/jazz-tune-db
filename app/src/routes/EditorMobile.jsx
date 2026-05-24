import { useState } from 'react';
import { DatabaseProvider, useDatabase } from './Editor/DatabaseContext';
import { TuneList } from '../components/TuneList';
import { PasteYouTubeModal } from '../components/PasteYouTubeModal';

function MobileEditorInner() {
  const { tunes, updateTune } = useDatabase();
  const [selectedId, setSelectedId] = useState(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

  const tune = tunes.find(t => t.id === selectedId);

  if (!tune) {
    return <TuneList tunes={tunes} onSelect={setSelectedId} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="sticky top-0 bg-white border-b border-zinc-200 px-3 py-3 flex items-center justify-between">
        <button onClick={() => setSelectedId(null)} className="text-sky-600 text-sm">← List</button>
        <span className="font-semibold truncate mx-2 flex-1 text-center">{tune.tune_name}</span>
        <span className="text-xs text-zinc-500 w-10">{/* save indicator goes here */}</span>
      </div>

      <div className="p-4 space-y-5">
        <Section title="Basics">
          <FormField label="Tune Name" value={tune.tune_name} onChange={v => updateTune(tune.id, { tune_name: v })} />
          <FormField label="Composer" value={tune.composer} onChange={v => updateTune(tune.id, { composer: v })} />
          <FormField label="Lyricist" value={tune.lyricist ?? ''} onChange={v => updateTune(tune.id, { lyricist: v })} />
          <FormField label="Year" type="number" value={tune.year ?? ''} onChange={v => updateTune(tune.id, { year: parseInt(v, 10) || null })} />
          <FormField label="Style" value={tune.style ?? ''} onChange={v => updateTune(tune.id, { style: v })} />
          <FormField label="Standard Key" value={tune.standard_key ?? ''} onChange={v => updateTune(tune.id, { standard_key: v })} />
          <FormField label="Rank" type="number" value={tune.rank ?? ''} onChange={v => updateTune(tune.id, { rank: parseInt(v, 10) || null })} />
          <FormToggle label="Approved" value={tune.is_approved} onChange={v => updateTune(tune.id, { is_approved: v })} />
        </Section>

        <Section title="Listen">
          <FormFieldList
            label="Famous Recordings"
            values={tune.famous_recordings ?? []}
            onChange={list => updateTune(tune.id, { famous_recordings: list })}
          />
          <button
            onClick={() => setShowYouTubeModal(true)}
            className="w-full px-4 py-3 bg-red-500 text-white rounded font-medium"
          >
            + Paste YouTube URL
          </button>
          <div className="text-sm text-zinc-600 mt-2">
            {(tune.youtube_video_ids?.length ?? 0)} performances · {(tune.youtube_backing_track_ids?.length ?? 0)} backing tracks
          </div>
        </Section>

        <Section title="Chords">
          <FormField
            label="Chord Progression (pipe-delimited)"
            value={tune.chords ?? ''}
            onChange={v => updateTune(tune.id, { chords: v })}
            multiline
          />
          <p className="text-xs text-zinc-500 mt-1">For visual chord editing, open this tune on your laptop.</p>
        </Section>

        <Section title="History">
          <FormField label="History &amp; Facts" value={tune.history_and_facts ?? ''} onChange={v => updateTune(tune.id, { history_and_facts: v })} multiline />
        </Section>

        <button
          onClick={() => {
            if (confirm('Archive this tune? (You can restore from the laptop editor.)')) {
              updateTune(tune.id, { is_archived: true });
              setSelectedId(null);
            }
          }}
          className="w-full px-4 py-3 border border-red-300 text-red-700 rounded"
        >
          Archive tune
        </button>
      </div>

      {showYouTubeModal && (
        <PasteYouTubeModal
          onClose={() => setShowYouTubeModal(false)}
          onAdd={(video, variant) => {
            const field = variant === 'backing' ? 'youtube_backing_track_ids' : 'youtube_video_ids';
            const current = tune[field] ?? [];
            updateTune(tune.id, { [field]: [...current, video] });
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded border border-zinc-200 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', multiline = false }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={6}
          className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded font-mono text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded"
        />
      )}
    </label>
  );
}

function FormToggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-sm text-zinc-700">{label}</span>
      <input
        type="checkbox"
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        className="w-5 h-5"
      />
    </label>
  );
}

function FormFieldList({ label, values, onChange }) {
  const update = (i, v) => onChange(values.map((x, j) => (i === j ? v : x)));
  const add = () => onChange([...values, '']);
  const remove = i => onChange(values.filter((_, j) => j !== i));
  return (
    <div>
      <span className="text-sm text-zinc-700">{label}</span>
      <div className="space-y-2 mt-1">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={e => update(i, e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-300 rounded"
            />
            <button onClick={() => remove(i)} className="px-3 text-red-600">×</button>
          </div>
        ))}
        <button onClick={add} className="text-sm text-sky-600">+ Add</button>
      </div>
    </div>
  );
}

export function EditorMobile() {
  return (
    <DatabaseProvider>
      <MobileEditorInner />
    </DatabaseProvider>
  );
}
