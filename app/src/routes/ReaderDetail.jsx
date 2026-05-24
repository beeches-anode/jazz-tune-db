import { useState, useMemo } from 'react';
import { TabStrip } from '../components/TabStrip';
import { OverviewTab } from '../components/OverviewTab';
import { ListenTab } from '../components/ListenTab';
import { ChordsTab } from '../components/ChordsTab';

export function ReaderDetail({ tune }) {
  const tabs = useMemo(() => {
    const t = [{ id: 'overview', label: 'Overview' }];
    const hasListen = tune.famous_recordings?.length > 0
      || tune.spotify_playlist_id
      || tune.youtube_video_ids?.length > 0
      || tune.youtube_backing_track_ids?.length > 0;
    if (hasListen) t.push({ id: 'listen', label: 'Listen' });
    if (tune.chords) t.push({ id: 'chords', label: 'Chords' });
    return t;
  }, [tune]);

  const [active, setActive] = useState('overview');

  return (
    <div className="flex flex-col h-full bg-white">
      <TabStrip tabs={tabs} activeId={active} onSelect={setActive} />
      <div className="flex-1 overflow-y-auto">
        {active === 'overview' && <OverviewTab tune={tune} />}
        {active === 'listen' && <ListenTab tune={tune} />}
        {active === 'chords' && <ChordsTab tune={tune} />}
      </div>
    </div>
  );
}
