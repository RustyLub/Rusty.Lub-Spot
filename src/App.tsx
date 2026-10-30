import React from 'react';
import { CompanionProvider, useCompanion } from './context/CompanionContext';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CCTVModal } from './components/CCTVModal';
import { SteamLoginModal } from './components/SteamLoginModal';

// 15 Pages
import { HomePage } from './pages/HomePage';
import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { PlayerTrackerPage } from './pages/PlayerTrackerPage';
import { SmartElectricalPage } from './pages/SmartElectricalPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TeamPage } from './pages/TeamPage';
import { ServersPage } from './pages/ServersPage';
import { CameraCodesPage } from './pages/CameraCodesPage';
import { PlantGeneticsPage } from './pages/PlantGeneticsPage';
import { RaidCalculatorPage } from './pages/RaidCalculatorPage';
import { DecayCalculatorPage } from './pages/DecayCalculatorPage';
import { RecyclerPage } from './pages/RecyclerPage';
import { ItemDatabasePage } from './pages/ItemDatabasePage';
import { HotkeysPage } from './pages/HotkeysPage';
import { SettingsPage } from './pages/SettingsPage';

const MainContent: React.FC = () => {
  const { activeTab, settings } = useCompanion();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'overview':
        return <OverviewPage />;
      case 'map':
        return <MapPage />;
      case 'player_tracker':
        return <PlayerTrackerPage />;
      case 'smart_electrical':
        return <SmartElectricalPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'team':
        return <TeamPage />;
      case 'servers':
        return <ServersPage />;
      case 'camera_codes':
        return <CameraCodesPage />;
      case 'plant_genetics':
        return <PlantGeneticsPage />;
      case 'raid_calculator':
        return <RaidCalculatorPage />;
      case 'decay_calculator':
        return <DecayCalculatorPage />;
      case 'recycler':
        return <RecyclerPage />;
      case 'item_database':
        return <ItemDatabasePage />;
      case 'hotkeys':
        return <HotkeysPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  const getThemeBg = () => {
    switch (settings.theme) {
      case 'rust':
        return 'bg-[#12100E] text-[#E6E8EC]';
      case 'black':
        return 'bg-[#08090C] text-[#E6E8EC]';
      case 'charcoal':
      default:
        return 'bg-[#0D0F12] text-[#E6E8EC]';
    }
  };

  return (
    <div className={`min-h-screen h-screen flex flex-col overflow-hidden font-sans ${getThemeBg()}`}>
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#101114]">
          {renderActivePage()}
        </main>
      </div>
      <CCTVModal />
      <SteamLoginModal />
    </div>
  );
};

export default function App() {
  return (
    <CompanionProvider>
      <MainContent />
    </CompanionProvider>
  );
}
