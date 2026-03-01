import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Trophy, Users, Play, Search, Globe, ChevronRight, Map as MapIcon, Timer } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiamFyZGFhIiwiYSI6ImNtbHFyaDlmdzAweG0zY3NhM2M0cms2bHcifQ.HuALFDZ1B6DFfqNStKvTeA';
mapboxgl.accessToken = MAPBOX_TOKEN;
console.log("Mapbox Token initialized:", MAPBOX_TOKEN.substring(0, 10) + "...");

// --- Components ---

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('geoquest_user') || 'null');

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Globe className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900">GeoQuest</span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/create')}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Create Quiz
        </button>
        {user ? (
          <button 
            onClick={() => navigate(`/profile/${user.id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors"
          >
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <span className="text-sm font-bold text-zinc-700">{user.username}</span>
          </button>
        ) : (
          <button 
            onClick={() => navigate('/join')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Sign In / Join
          </button>
        )}
      </div>
    </nav>
  );
}

// --- Pages ---

function HomePage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/quizzes').then(res => res.json()).then(setQuizzes);
    fetch('/api/leaderboard').then(res => res.json()).then(setLeaderboard);
  }, []);

  const handleStartGame = async (quizId: string) => {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId })
    });
    const { joinCode } = await res.json();
    navigate(`/host/${joinCode}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-4">Explore the World</h1>
            <p className="text-lg text-zinc-600 max-w-2xl">
              Challenge your geography skills with interactive map quizzes. Pinpoint locations, earn points, and climb the leaderboard.
            </p>
          </div>
          <button 
            onClick={() => navigate('/create')}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg"
          >
            <MapIcon className="w-5 h-5" />
            Create Your Own Quiz
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black text-zinc-900 mb-8 flex items-center gap-2">
              <MapIcon className="text-indigo-600 w-6 h-6" />
              Featured Quizzes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm group cursor-pointer"
                  onClick={() => handleStartGame(quiz.id)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={quiz.image_url} 
                      alt={quiz.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider rounded-full text-zinc-900">
                        {quiz.region || 'Geography'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{quiz.title}</h3>
                    <p className="text-zinc-600 text-sm mb-6 line-clamp-2">{quiz.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          <span className="text-xs font-medium">1.2k plays</span>
                        </div>
                      </div>
                      <button className="flex items-center gap-1 text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                        Play Now <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-2xl font-black text-zinc-900 mb-8 flex items-center gap-2">
              <Trophy className="text-yellow-500 w-6 h-6" />
              Top Explorers
            </h2>
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
              <div className="space-y-4">
                {leaderboard.map((user, idx) => (
                  <div key={user.username} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        idx === 0 ? "bg-yellow-400 text-white" : "bg-zinc-200 text-zinc-600"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-zinc-900">{user.username}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-indigo-600">{user.total_score}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user.games_played} games</p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-zinc-400 text-center py-8">No explorers yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinPage() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('geoquest_user') || 'null');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    navigate(`/play/${code.toUpperCase()}?name=${encodeURIComponent(name)}${user ? `&userId=${user.id}` : ''}`);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('geoquest_user', JSON.stringify(data));
      setIsRegistering(false);
      setName(data.username);
    } else {
      alert('Username already exists');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            < Globe className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900">Sign In or Join</h1>
          <p className="text-zinc-500 font-medium mt-2">Enter a game pin or create a profile</p>
        </div>

        {isRegistering ? (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Choose Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full px-6 py-4 bg-zinc-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Explorer123"
                required
              />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors">
              Create Profile
            </button>
            <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-zinc-400 font-bold text-sm">
              Back to Join
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Game Pin</label>
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full px-6 py-4 bg-zinc-100 rounded-2xl font-black text-3xl text-center tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Your Nickname</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-6 py-4 bg-zinc-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter name"
                required
              />
            </div>
            <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-zinc-800 transition-colors">
              Enter Game
            </button>
            
            {!user && (
              <div className="pt-6 border-t border-zinc-100 text-center">
                <p className="text-zinc-400 text-sm font-medium mb-4">Want to track your progress?</p>
                <button 
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Create a Student Profile
                </button>
              </div>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}

function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/users/${id}`).then(res => res.json()).then(setUser);
  }, [id]);

  if (!user) return <div className="pt-24 px-6 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm mb-8 flex items-center gap-8">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl text-white font-black">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900">{user.username}</h1>
            <p className="text-zinc-500 font-medium">Student ID: <span className="text-indigo-600 font-bold">{user.student_id}</span></p>
            <div className="flex gap-4 mt-4">
              <div className="bg-zinc-100 px-4 py-2 rounded-xl">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Games Played</p>
                <p className="text-xl font-black">{user.history.length}</p>
              </div>
              <div className="bg-zinc-100 px-4 py-2 rounded-xl">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Score</p>
                <p className="text-xl font-black">{user.history.reduce((acc: number, h: any) => acc + h.score, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Timer className="w-5 h-5 text-indigo-600" />
              Quiz History
            </h2>
            <div className="space-y-4">
              {user.history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div>
                    <p className="font-bold text-zinc-900">{h.quiz_title}</p>
                    <p className="text-xs text-zinc-400">{new Date(h.played_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-black text-indigo-600">{h.score} pts</p>
                </div>
              ))}
              {user.history.length === 0 && <p className="text-zinc-400 text-center py-8">No quizzes played yet.</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-500 w-5 h-5" />
              Global Rank
            </h2>
            <p className="text-zinc-500 mb-4">Compete with explorers worldwide!</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateQuizPage() {
  const [step, setStep] = useState(1);
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    imageUrl: 'https://picsum.photos/seed/geography/800/600',
    region: 'World',
    questions: [] as any[]
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'pinpoint',
    location_name: '',
    lat: 0,
    lng: 0,
    options: ['', '', '', ''],
    correct_answer: '',
    timeLimit: 30,
    points: 1000
  });
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (step === 3 && mapRef.current && !mapInstance.current) {
      const initMap = () => {
        if (!mapRef.current || mapInstance.current) return;
        console.log("Initializing CreateQuiz map...");
        try {
          mapInstance.current = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [0, 20],
            zoom: 1.5,
            attributionControl: false
          });
          mapInstance.current.on('load', () => {
            console.log("CreateQuiz map loaded");
            mapInstance.current?.resize();
            mapInstance.current?.addControl(new mapboxgl.NavigationControl());
          });
          mapInstance.current.on('click', (e) => {
            if (markerRef.current) markerRef.current.remove();
            markerRef.current = new mapboxgl.Marker({ color: '#4f46e5' }).setLngLat(e.lngLat).addTo(mapInstance.current!);
            setCurrentQuestion(prev => ({ ...prev, lat: e.lngLat.lat, lng: e.lngLat.lng }));
          });
        } catch (e) {
          console.error("CreateQuiz map init error:", e);
        }
      };
      const timer = setTimeout(initMap, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const addQuestion = () => {
    setQuiz(prev => ({ ...prev, questions: [...prev.questions, currentQuestion] }));
    setCurrentQuestion({
      type: 'pinpoint',
      location_name: '',
      lat: 0,
      lng: 0,
      options: ['', '', '', ''],
      correct_answer: '',
      timeLimit: 30,
      points: 1000
    });
    if (markerRef.current) markerRef.current.remove();
  };

  const saveQuiz = async () => {
    const user = JSON.parse(localStorage.getItem('geoquest_user') || 'null');
    await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...quiz, creatorId: user?.id })
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="bg-zinc-900 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step === s ? "bg-indigo-600" : "bg-zinc-700")}>
                {s}
              </div>
            ))}
          </div>
          <h1 className="text-3xl font-black">Create Your Quest</h1>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Quiz Title</label>
                <input 
                  type="text" 
                  value={quiz.title} 
                  onChange={e => setQuiz({...quiz, title: e.target.value})}
                  className="w-full px-6 py-4 bg-zinc-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Hidden Gems of Europe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  value={quiz.description} 
                  onChange={e => setQuiz({...quiz, description: e.target.value})}
                  className="w-full px-6 py-4 bg-zinc-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  placeholder="What is this quiz about?"
                />
              </div>
              <button onClick={() => setStep(2)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Next Step</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Select Region</label>
              <div className="grid grid-cols-2 gap-4">
                {['World', 'Europe', 'Asia', 'Americas', 'Africa', 'Oceania'].map(r => (
                  <button 
                    key={r} 
                    onClick={() => setQuiz({...quiz, region: r})}
                    className={cn("p-6 rounded-2xl border-2 font-bold transition-all", quiz.region === r ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-zinc-100 hover:border-zinc-200")}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Next Step</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Question Type</label>
                    <select 
                      value={currentQuestion.type}
                      onChange={e => setCurrentQuestion({...currentQuestion, type: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-100 rounded-xl font-bold outline-none"
                    >
                      <option value="pinpoint">Pinpoint Location</option>
                      <option value="capital">Identify Capital</option>
                      <option value="flag">Match Flag</option>
                      <option value="feature">Geographical Feature</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Location/Question Name</label>
                    <input 
                      type="text" 
                      value={currentQuestion.location_name}
                      onChange={e => setCurrentQuestion({...currentQuestion, location_name: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-100 rounded-xl font-bold outline-none"
                      placeholder="e.g., Mount Everest"
                    />
                  </div>
                  {currentQuestion.type !== 'pinpoint' && currentQuestion.type !== 'feature' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Options (Correct first)</label>
                      {currentQuestion.options.map((opt, i) => (
                        <input 
                          key={i}
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...currentQuestion.options];
                            newOpts[i] = e.target.value;
                            setCurrentQuestion({...currentQuestion, options: newOpts, correct_answer: newOpts[0]});
                          }}
                          className="w-full px-4 py-2 bg-zinc-100 rounded-lg font-medium outline-none"
                          placeholder={`Option ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Time (s)</label>
                      <input type="number" value={currentQuestion.timeLimit} onChange={e => setCurrentQuestion({...currentQuestion, timeLimit: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-zinc-100 rounded-lg font-bold" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Points</label>
                      <input type="number" value={currentQuestion.points} onChange={e => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-zinc-100 rounded-lg font-bold" />
                    </div>
                  </div>
                  <button onClick={addQuestion} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold">Add Question</button>
                </div>
                <div className="h-[400px] rounded-2xl overflow-hidden border border-zinc-200 relative">
                  <div ref={mapRef} className="absolute inset-0" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-[10px] font-bold shadow-sm">
                    Click map to set coordinates
                  </div>
                </div>
              </div>
              
              <div className="border-t border-zinc-100 pt-6">
                <h3 className="font-black mb-4">Questions ({quiz.questions.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {quiz.questions.map((q, i) => (
                    <div key={i} className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">
                      {i + 1}. {q.location_name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold">Back</button>
                <button onClick={saveQuiz} disabled={quiz.questions.length === 0} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-50">Finish & Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HostLobby() {
  const { code } = useParams();
  const [players, setPlayers] = useState<any[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', joinCode: code, isHost: true }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'error') {
        alert(data.message);
        navigate('/join');
      } else if (data.type === 'player_joined') {
        setPlayers(data.players);
      } else if (data.type === 'game_started') {
        navigate(`/host/${code}/game`);
      }
    };

    return () => ws.close();
  }, [code, navigate]);

  const startGame = () => {
    console.log("Host starting game for code:", code);
    socketRef.current?.send(JSON.stringify({ type: 'start_game' }));
  };

  return (
    <div className="min-h-screen bg-indigo-600 text-white p-8 flex flex-col">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-6xl font-black mb-2">GeoQuest</h1>
          <p className="text-indigo-200 font-bold text-xl">Waiting for explorers...</p>
        </div>
        <div className="bg-white text-zinc-900 p-6 rounded-3xl shadow-xl text-center min-w-[240px] relative group">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Game Pin</p>
          <p className="text-5xl font-black tracking-tighter">{code}</p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(code || '');
              alert('Code copied to clipboard!');
            }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Copy Code
          </button>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8" />
          <h2 className="text-3xl font-black">{players.length} Players</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center font-bold text-lg"
              >
                {player.name}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <button
          onClick={startGame}
          disabled={players.length === 0}
          className="px-12 py-5 bg-white text-indigo-600 rounded-2xl text-2xl font-black shadow-2xl hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

function GameView() {
  const { code } = useParams();
  const [gameState, setGameState] = useState<'playing' | 'results' | 'finished'>('playing');
  const [question, setQuestion] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [correctLocation, setCorrectLocation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const socketRef = useRef<WebSocket | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const correctMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const [mapStatus, setMapStatus] = useState('Initializing...');

  const isHost = window.location.pathname.includes('/host/');
  const playerName = new URLSearchParams(window.location.search).get('name');

  useEffect(() => {
    console.log("GameView State Update:", { gameState, hasQuestion: !!question, timeLeft, hasAnswered });
    if (mapRef.current) {
      console.log("Map container dimensions:", mapRef.current.clientWidth, "x", mapRef.current.clientHeight);
    }
  }, [gameState, question, timeLeft, hasAnswered]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = ws;

    ws.onopen = () => {
      const upperCode = code?.toUpperCase();
      console.log("WS Connected in GameView, joining session:", upperCode);
      const userId = new URLSearchParams(window.location.search).get('userId');
      ws.send(JSON.stringify({ type: 'join', joinCode: upperCode, playerName, isHost, userId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Message received:", data.type, data);
      switch (data.type) {
        case 'joined':
          console.log("Joined session:", data.sessionId);
          if (data.question) {
            setQuestion(data.question);
            setGameState('playing');
          }
          break;
        case 'error':
          console.error("WS Error:", data.message);
          alert(data.message);
          navigate('/');
          break;
        case 'game_started':
        case 'new_question':
          setQuestion(data.question);
          setGameState('playing');
          setHasAnswered(false);
          setCorrectLocation(null);
          setTimeLeft(30);
          startTimeRef.current = Date.now();
          if (correctMarkerRef.current) correctMarkerRef.current.remove();
          if (markerRef.current) markerRef.current.remove();
          break;
        case 'all_answered':
          setCorrectLocation(data.correctLocation);
          setLeaderboard(data.leaderboard);
          setGameState('results');
          break;
        case 'game_over':
          setLeaderboard(data.leaderboard);
          setGameState('finished');
          break;
      }
    };

    ws.onclose = () => {
      console.log("WS Closed in GameView");
    };

    return () => {
      ws.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [code, playerName, isHost]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) return;

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;
      
      console.log("Initializing map with token:", mapboxgl.accessToken?.substring(0, 10) + "...");
      setMapStatus('Loading Style...');
      try {
        mapInstance.current = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [0, 20],
          zoom: 1.5,
          attributionControl: false
        });

        mapInstance.current.on('style.load', () => {
          setMapStatus('Style Loaded');
        });

        mapInstance.current.on('load', () => {
          console.log("Map loaded successfully");
          setMapStatus('Ready');
          mapInstance.current?.resize();
          mapInstance.current?.addControl(new mapboxgl.NavigationControl());
        });

        mapInstance.current.on('error', (e) => {
          console.error("Mapbox error:", e);
          setMapStatus(`Error: ${e.error?.message || 'Unknown'}`);
        });

        mapInstance.current.on('click', (e) => {
          if (isHostRef.current || hasAnsweredRef.current || gameStateRef.current !== 'playing') return;

          if (markerRef.current) markerRef.current.remove();
          markerRef.current = new mapboxgl.Marker({ color: '#4f46e5' })
            .setLngLat(e.lngLat)
            .addTo(mapInstance.current!);
        });
      } catch (err) {
        console.error("Mapbox initialization failed:", err);
        setMapStatus(`Init Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    };

    const timer = setTimeout(initMap, 500); // Give layout a moment to settle

    // Handle window resize
    const handleResize = () => {
      mapInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Keep refs in sync for map click handler
  const isHostRef = useRef(isHost);
  const hasAnsweredRef = useRef(hasAnswered);
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    isHostRef.current = isHost;
    hasAnsweredRef.current = hasAnswered;
    gameStateRef.current = gameState;
  }, [isHost, hasAnswered, gameState]);

  useEffect(() => {
    if (gameState === 'results' && correctLocation && mapInstance.current) {
      if (correctMarkerRef.current) correctMarkerRef.current.remove();
      correctMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([correctLocation.lng, correctLocation.lat])
        .addTo(mapInstance.current);
      
      mapInstance.current.flyTo({
        center: [correctLocation.lng, correctLocation.lat],
        zoom: 4,
        duration: 2000
      });
    }
  }, [gameState, correctLocation]);

  const submitAnswer = (answer?: string) => {
    if (question.type === 'pinpoint' || question.type === 'feature') {
      if (!markerRef.current) return;
      const { lng, lat } = markerRef.current.getLngLat();
      const timeTaken = Date.now() - startTimeRef.current;
      socketRef.current?.send(JSON.stringify({ type: 'submit_answer', lat, lng, timeTaken }));
    } else {
      const timeTaken = Date.now() - startTimeRef.current;
      socketRef.current?.send(JSON.stringify({ type: 'submit_answer', answer, timeTaken }));
    }
    setHasAnswered(true);
  };

  const nextQuestion = () => {
    socketRef.current?.send(JSON.stringify({ type: 'next_question' }));
  };

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-8 text-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl bg-white rounded-3xl p-12 text-zinc-900 shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
              <Trophy className="text-yellow-500 w-12 h-12" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-center mb-12">Final Leaderboard</h2>
          <div className="space-y-4">
            {leaderboard.map((player, idx) => (
              <div key={player.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    idx === 0 ? "bg-yellow-400 text-white" : "bg-zinc-200 text-zinc-600"
                  )}>
                    {idx + 1}
                  </span>
                  <span className="font-bold text-lg">{player.name}</span>
                </div>
                <span className="font-black text-indigo-600 text-xl">{player.score} pts</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      <style>{`
        .mapboxgl-map {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
      {/* Header */}
      <div className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <MapIcon className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Target Location</p>
            <h2 className="text-xl font-black text-zinc-900">{question?.location_name || 'Loading...'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Timer className={cn("w-6 h-6", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-zinc-400")} />
            <span className={cn("text-2xl font-black tabular-nums", timeLeft < 10 ? "text-red-500" : "text-zinc-900")}>
              {timeLeft}s
            </span>
          </div>
          {isHost && gameState === 'results' && (
            <button
              onClick={nextQuestion}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Next Question
            </button>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Map Container - Always present and filling space */}
        <div 
          ref={mapRef} 
          className={cn(
            "absolute inset-0 transition-opacity duration-500 bg-zinc-800",
            (!question || question?.type === 'pinpoint' || question?.type === 'feature') ? "opacity-100" : "opacity-0"
          )}
          style={{ zIndex: 1 }}
        />
        
        {/* Debug Info Overlay */}
        <div className="absolute top-4 left-4 z-[100] bg-black/90 text-white p-4 rounded-xl text-[10px] font-mono border border-white/10 shadow-2xl pointer-events-auto">
          <div className="font-black text-indigo-400 mb-2 uppercase tracking-widest">Debug Console</div>
          <div>State: {gameState}</div>
          <div>Map: {mapStatus}</div>
          <div>Question: {question ? `${question.type} (${question.location_name})` : 'NULL'}</div>
          <div>Answered: {hasAnswered ? 'YES' : 'NO'}</div>
          <div>Time: {timeLeft}s</div>
          <div>IsHost: {isHost ? 'YES' : 'NO'}</div>
          <div>Code: {code}</div>
          <div className="mt-3 flex gap-2">
            <button 
              className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              onClick={() => {
                const upperCode = code?.toUpperCase();
                console.log("Force joining...", upperCode);
                const userId = new URLSearchParams(window.location.search).get('userId');
                socketRef.current?.send(JSON.stringify({ type: 'join', joinCode: upperCode, playerName, isHost, userId }));
              }}
            >
              Join
            </button>
            <button 
              className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
        
        {/* Multiple Choice View */}
        {(question?.type === 'capital' || question?.type === 'flag') && (
          <div className="absolute inset-0 bg-zinc-100 flex flex-col items-center justify-center p-12 z-10">
            {question?.type === 'flag' && question?.image_url && (
              <img src={question.image_url} alt="Flag" className="w-64 h-40 object-cover rounded-2xl shadow-xl mb-12 border-4 border-white" />
            )}
            <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
              {question?.options?.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => submitAnswer(opt)}
                  disabled={hasAnswered || isHost}
                  className={cn(
                    "p-8 bg-white rounded-3xl text-2xl font-black shadow-lg hover:shadow-xl transition-all active:scale-95 border-4 border-transparent",
                    hasAnswered && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {!question && (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-12 z-20">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 font-bold">Connecting to Quest...</p>
          </div>
        )}

        {/* Overlay UI */}
        {gameState === 'playing' && !isHost && !hasAnswered && (question?.type === 'pinpoint' || question?.type === 'feature') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
          >
            <button
              onClick={() => submitAnswer()}
              className="px-12 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-3"
            >
              <MapPin className="w-6 h-6" />
              Pinpoint!
            </button>
          </motion.div>
        )}

        {hasAnswered && gameState === 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40"
          >
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black mb-2">Answer Submitted!</h3>
              <p className="text-white/60 font-bold">Waiting for other players...</p>
            </div>
          </motion.div>
        )}

        {gameState === 'results' && (
          <motion.div 
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-8 right-8 bottom-8 w-80 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 z-50 overflow-y-auto"
          >
            <h3 className="text-2xl font-black text-zinc-900 mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-500 w-6 h-6" />
              Standings
            </h3>
            <div className="space-y-3">
              {leaderboard.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-zinc-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-zinc-400 w-4">{idx + 1}</span>
                    <span className="font-bold text-zinc-900">{player.name}</span>
                  </div>
                  <span className="font-black text-indigo-600">{player.score}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Navbar /><HomePage /></>} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/profile/:id" element={<><Navbar /><ProfilePage /></>} />
        <Route path="/create" element={<><Navbar /><CreateQuizPage /></>} />
        <Route path="/host/:code" element={<HostLobby />} />
        <Route path="/host/:code/game" element={<GameView />} />
        <Route path="/play/:code" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );
}
