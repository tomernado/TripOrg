import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Navigation, Bike, AlertTriangle, MapPin } from 'lucide-react';
import { config } from './routesData';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 9);
  return null;
}

function MapResizer({ trigger }: { trigger: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [trigger, map]);
  return null;
}

export default function App() {
  const [activeDay, setActiveDay] = useState<string>('1');
  const [mapHeightPct, setMapHeightPct] = useState(50);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentData = config[activeDay as keyof typeof config];

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleNavigate = (coords: [number, number]) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`;
    window.open(url, '_blank');
  };

  const handleOpenFullRoute = () => {
    const points = currentData.routePoints
      .map((p: [number, number]) => `${p[0]},${p[1]}`)
      .join('/');
    window.open(`https://www.google.com/maps/dir/${points}`, '_blank');
  };

  const onDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!contentRef.current) return;
      const clientY = 'touches' in ev
        ? (ev as TouchEvent).touches[0].clientY
        : (ev as MouseEvent).clientY;
      const rect = contentRef.current.getBoundingClientRect();
      const pct = ((clientY - rect.top) / rect.height) * 100;
      setMapHeightPct(Math.min(Math.max(pct, 15), 85));
      ev.preventDefault();
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans text-right" dir="rtl">
      <header className="bg-gray-800 p-4 shadow-md flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Bike className="w-8 h-8 text-amber-500" />
          <h1 className="text-xl font-bold tracking-tight text-amber-500">יוון על שני גלגלים</h1>
        </div>
        <span className="text-sm bg-gray-700 px-3 py-1 rounded-full text-gray-300 font-medium">5 ימי רכיבה</span>
      </header>

      <div className="flex overflow-x-auto bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-sm scrollbar-none">
        {Object.keys(config).map((dayKey) => (
          <button
            key={dayKey}
            onClick={() => setActiveDay(dayKey)}
            className={`flex-1 min-w-[80px] text-center py-3.5 px-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeDay === dayKey
                ? 'border-amber-500 text-amber-500 bg-gray-800'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            יום {dayKey}
          </button>
        ))}
      </div>

      <div ref={contentRef} className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div
          className="w-full md:w-2/3 md:h-full relative z-10 flex-shrink-0"
          style={isMobile ? { height: `${mapHeightPct}%` } : undefined}
        >
          <MapContainer
            center={currentData.routePoints[0] as [number, number]}
            zoom={9}
            className="h-full w-full"
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={currentData.routePoints[0] as [number, number]} />
            <MapResizer trigger={mapHeightPct} />

            <Polyline positions={currentData.routePoints as [number, number][]} color="#f59e0b" weight={5} opacity={0.8} />

            <CircleMarker
              center={currentData.routePoints[0] as [number, number]}
              radius={10}
              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
            >
              <Popup>
                <div className="text-right font-sans p-1" dir="rtl">
                  <h4 className="font-bold text-gray-900 m-0">נקודת מוצא</h4>
                  <p className="text-xs text-gray-600 mt-1">תחילת המסלול ביום {currentData.day}</p>
                </div>
              </Popup>
            </CircleMarker>

            <CircleMarker
              center={currentData.routePoints[currentData.routePoints.length - 1] as [number, number]}
              radius={10}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
            >
              <Popup>
                <div className="text-right font-sans p-1" dir="rtl">
                  <h4 className="font-bold text-gray-900 m-0">נקודת יעד</h4>
                  <p className="text-xs text-gray-600 mt-1">סיום המסלול ביום {currentData.day}</p>
                </div>
              </Popup>
            </CircleMarker>

            {currentData.pois.map((poi, idx) => (
              <Marker key={idx} position={poi.coords as [number, number]}>
                <Popup>
                  <div className="text-right font-sans p-1 min-w-[200px]" dir="rtl">
                    <h4 className="font-bold text-gray-900 m-0">{poi.name}</h4>
                    <p className="text-xs text-gray-600 mt-1 mb-2">{poi.description}</p>
                    <button
                      onClick={() => handleNavigate(poi.coords as [number, number])}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs py-2 px-2 rounded font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4" /> ניווט ב-Maps
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div
          className="md:hidden flex items-center justify-center bg-gray-800 border-y border-gray-600 h-7 cursor-row-resize touch-none select-none flex-shrink-0 z-20"
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
        >
          <div className="w-10 h-1 rounded-full bg-gray-500" />
        </div>

        <div className="w-full md:w-1/3 flex flex-col bg-gray-900 overflow-y-auto p-4 space-y-4 flex-1 min-h-0">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{currentData.title}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-gray-900 p-2 rounded border border-gray-700">
                <span className="text-gray-400 block">מרחק ממוצע</span>
                <span className="font-bold text-amber-500 text-sm">{currentData.distance}</span>
              </div>
              <div className="bg-gray-900 p-2 rounded border border-gray-700">
                <span className="text-gray-400 block">אופי הרכיבה</span>
                <span className="font-bold text-gray-200 text-xs line-clamp-2">{currentData.terrain}</span>
              </div>
            </div>
            <button
              onClick={handleOpenFullRoute}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 text-xs font-bold py-2.5 px-3 rounded-lg transition-colors"
            >
              <Navigation className="w-4 h-4" />
              פתח מסלול מלא ב-Google Maps
            </button>
          </div>

          <div className="bg-red-950/40 border border-red-800/60 p-3 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-red-400">טיפ בטיחות ודלק</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{currentData.safetyTip}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 tracking-wider">נקודות עצירה ועניין</h3>
            {currentData.pois.map((poi, idx) => (
              <div
                key={idx}
                className="bg-gray-800 hover:bg-gray-700 transition-colors p-3 rounded-xl border border-gray-700/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg shrink-0 mt-0.5 border border-amber-500/20">
                    <MapPin className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{poi.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{poi.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate(poi.coords as [number, number])}
                  className="bg-amber-500 hover:bg-amber-600 p-2.5 rounded-xl text-gray-900 transition-all shrink-0 shadow-md"
                  title="פתח ב-Google Maps"
                >
                  <Navigation className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-600 pt-2 pb-1">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
          </p>
        </div>
      </div>
    </div>
  );
}
