import React, { useState } from 'react';
import {
  Users,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  UserCheck,
  Mic,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  Team,
  PhotoItem,
  WaitlistEntry,
  GroupPost,
  VoiceMessageData,
  UserProfile,
} from '@/src/shared/types/index';
import { INITIAL_WAITLIST } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';
import {
  VoiceMessageRecorder,
  VoiceMessagePlayer,
} from '@/src/contexts/engagement/components/VoiceMessageModule';
import { CrmRegistryView } from '@/src/contexts/crew/components/CrmRegistryView';

interface TeamGroupAndCommunityProps {
  team: Team;
  currentUser?: UserProfile;
  photos: PhotoItem[];
  onUploadPhoto: (photo: PhotoItem) => void;
  onAddPost: (post: GroupPost) => void;
  onOpenMascotWithTopic: (topic: string) => void;
  onOpenAiRegistration?: (teamId?: string) => void;
  onSwitchToTeam?: (team: Team, mentor: UserProfile) => void;
  initialTab?: 'group' | 'photos' | 'waitlist' | 'crm';
}

export const TeamGroupAndCommunity: React.FC<TeamGroupAndCommunityProps> = ({
  team,
  currentUser,
  photos,
  onUploadPhoto,
  onAddPost,
  onOpenMascotWithTopic,
  onOpenAiRegistration,
  onSwitchToTeam,
  initialTab = 'group',
}) => {
  const [activeTab, setActiveTab] = useState<'group' | 'photos' | 'waitlist' | 'crm'>(initialTab);
  const [postComposerMode, setPostComposerMode] = useState<'voice' | 'text'>('voice');
  const [newPostText, setNewPostText] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isDictatingText, setIsDictatingText] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || !newPostTitle.trim()) return;

    const post: GroupPost = {
      id: `p-${Date.now()}`,
      authorName: `${team.mentorName} (Наставник)`,
      authorRole: 'Наставник',
      type: 'update',
      title: newPostTitle,
      content: newPostText,
      createdAt: 'Только что',
      likes: 1,
      commentsCount: 0,
    };

    onAddPost(post);
    setNewPostTitle('');
    setNewPostText('');
    audioService.playSuccessChime();
  };

  const handleSendVoiceMessage = (data: {
    title: string;
    transcript: string;
    voiceData: VoiceMessageData;
  }) => {
    const post: GroupPost = {
      id: `p-voice-${Date.now()}`,
      authorName: `${team.mentorName} (Наставник)`,
      authorRole: 'Наставник',
      type: 'voice',
      title: data.title,
      content: data.transcript,
      createdAt: 'Только что',
      likes: 1,
      commentsCount: 0,
      voiceMessage: data.voiceData,
    };

    onAddPost(post);
    audioService.playSuccessChime();
  };

  const handleToggleTextDictation = () => {
    if (isDictatingText) {
      audioService.stopListening();
      setIsDictatingText(false);
    } else {
      const ok = audioService.startListening({
        onStart: () => setIsDictatingText(true),
        onResult: (transcript, isFinal) => {
          setNewPostText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          if (isFinal) {
            setIsDictatingText(false);
          }
        },
        onError: () => setIsDictatingText(false),
        onEnd: () => setIsDictatingText(false),
      });
      if (!ok) {
        setIsDictatingText(false);
      }
    }
  };

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result as string;
      const photo: PhotoItem = {
        id: `ph-${Date.now()}`,
        teamId: team.id,
        teamName: team.name,
        uploaderName: team.mentorName,
        uploaderRole: 'mentor',
        url: resultUrl,
        caption:
          newPhotoCaption.trim() || 'Фотография команды с рабочего процесса подготовки CubeSat',
        takenAt: new Date().toLocaleString(),
        status: 'published',
      };

      onUploadPhoto(photo);
      setNewPhotoCaption('');
      audioService.playSuccessChime();
      alert('Фотография успешно загружена в Фотостанцию и привязана к команде!');
    };
    reader.readAsDataURL(file);
  };

  const handleAcceptWaitlistInvite = (id: string) => {
    setWaitlist((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status: 'accepted' as const } : entry)),
    );
    audioService.playSuccessChime();
    alert('Приглашение из листа ожидания успешно принято! Команда добавлена в основной список.');
  };

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto">
      {/* Top Segmented Controller */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'group'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Группа «{team.name}»</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'photos'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Фотостанция</span>
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'waitlist'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Лист ожидания</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'crm'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-300" />
          <span>CRM & Реестр (16 экипажей)</span>
        </button>
      </div>

      {/* TAB 1: ПРОСТРАНСТВО КОМАНДЫ (PROJECT GROUP) */}
      {activeTab === 'group' && (
        <div className="space-y-4">
          {/* Team Info Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <span className="text-indigo-400 font-semibold">{team.school}</span>
                  <span aria-hidden="true">·</span>
                  <span>{team.city}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Команда «{team.name}» · {team.cubesatName} ({team.cubesatFormat})
                </h2>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg self-start sm:self-auto font-medium">
                Основной список участников
              </span>
            </div>

            {/* Members Roster */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      {member.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{member.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {member.role === 'captain'
                          ? 'Капитан'
                          : member.role === 'physicist'
                            ? 'Физик-теоретик'
                            : 'Инженер-конструктор'}{' '}
                        · {member.grade} класс
                      </div>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          {/* New Post Creator (Voice & Text modes) */}
          <div className="space-y-3">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setPostComposerMode('voice')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  postComposerMode === 'voice'
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Запись и транскрибация голоса (audioService)</span>
              </button>

              <button
                type="button"
                onClick={() => setPostComposerMode('text')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  postComposerMode === 'text'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Текстовая запись / Расчет</span>
              </button>
            </div>

            {/* Mode 1: Voice Recorder Component */}
            {postComposerMode === 'voice' && (
              <VoiceMessageRecorder
                onSendVoiceMessage={handleSendVoiceMessage}
                teamName={team.name}
                authorName={team.mentorName}
              />
            )}

            {/* Mode 2: Traditional Text Form with Speech Dictation Button */}
            {postComposerMode === 'text' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Опубликовать расчет, слайд или новость в ленту команды</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleToggleTextDictation}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                      isDictatingText
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Голосовой ввод текста через audioService"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isDictatingText ? 'Слушаю...' : 'Диктовать'}</span>
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Заголовок записи..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    rows={2}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Текст сообщения, выводы по расчету орбиты..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      Сообщение мгновенно появится в ленте борта «{team.name}»
                    </span>
                    <button
                      type="submit"
                      disabled={!newPostText.trim() || !newPostTitle.trim()}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Опубликовать в группу</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Posts Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold uppercase text-[11px] text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Бортовая лента радиопередач и записей ({team.groupPosts.length})</span>
              </span>
              <span className="text-[11px] font-mono text-indigo-400">
                Канал борта «{team.name}»
              </span>
            </div>

            {team.groupPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{post.authorName}</span>
                    {post.voiceMessage && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-medium flex items-center gap-1">
                        <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                        <span>Голосовое (audioService)</span>
                      </span>
                    )}
                  </div>
                  <span>{post.createdAt}</span>
                </div>

                <h4 className="font-bold text-white text-sm">{post.title}</h4>

                {post.voiceMessage ? (
                  <VoiceMessagePlayer voiceData={post.voiceMessage} authorName={post.authorName} />
                ) : (
                  <p className="text-slate-300 leading-relaxed">{post.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ФОТОСТАНЦИЯ (PHOTO STATION) */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          {/* Mobile Camera Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-400" />
              Прямая мобильная загрузка фото/видео (PWA)
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Сделайте снимок на камеру телефона или выберите файл из галереи. Фото команды сразу
              публикуются в проекте.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="Подпись к снимку (например, испытания антенны кубсата)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <label className="min-h-[48px] px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                <UploadCloud className="w-4 h-4" />
                <span>📷 Сделать снимок / Загрузить фото</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleSimulatePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {photos.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs"
              >
                <div className="aspect-video w-full bg-slate-900 relative">
                  <img
                    src={item.url}
                    alt={item.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 text-[10px] bg-slate-950/80 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                    Опубликовано
                  </span>
                </div>

                <div className="p-3 space-y-1">
                  <p className="font-medium text-white">{item.caption}</p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{item.teamName || item.uploaderName}</span>
                    <span>{item.takenAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ЛИСТ ОЖИДАНИЯ (WAITLIST) */}
      {activeTab === 'waitlist' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Лист ожидания команд чемпионата
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                При отказе команды из основного списка приглашение направляется первому в очереди.
                Срок действия ссылки — 48 часов.
              </p>
            </div>

            {onOpenAiRegistration && (
              <button
                type="button"
                onClick={() => onOpenAiRegistration()}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Сопоставить квоту</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {waitlist.map((entry) => (
              <div
                key={entry.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  entry.status === 'invited'
                    ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
                      #{entry.position}
                    </span>
                    <span className="font-bold text-white text-sm">Команда «{entry.teamName}»</span>
                    {entry.status === 'invited' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold">
                        Приглашение отправлено!
                      </span>
                    )}
                    {entry.status === 'accepted' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                        Зачислена
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 text-xs pl-8">
                    {entry.school} · Наставник: {entry.mentorName} ({entry.mentorEmail})
                  </div>
                  {entry.status === 'invited' && (
                    <div className="text-amber-400 font-mono text-[11px] pl-8">
                      ⏳ До истечения 48 часов осталось: 31ч 14мин
                    </div>
                  )}
                </div>

                <div className="pl-8 sm:pl-0 shrink-0">
                  {entry.status === 'invited' ? (
                    <button
                      onClick={() => handleAcceptWaitlistInvite(entry.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-sm"
                    >
                      Принять квоту (48 ч)
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono">
                      {entry.status === 'accepted' ? 'Место подтверждено' : 'В ожидании очереди'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ВНУТРЕННЯЯ CRM СИСТЕМА И РЕЕСТР КОМАНД (16 ЭКИПАЖЕЙ) */}
      {activeTab === 'crm' && (
        <CrmRegistryView
          currentTeam={team}
          currentUser={
            currentUser || {
              id: 'temp-user',
              name: team.mentorName,
              email: team.mentorEmail,
              role: 'mentor',
              school: team.school,
              city: team.city,
              photoConsent: true,
              xp: 0,
              level: 1,
              rankTitle: 'Капитан',
              energyCrystals: 0,
              streakDays: 0,
              badges: [],
              socialPosts: [],
            }
          }
          onOpenAiRegistration={(teamId) => onOpenAiRegistration && onOpenAiRegistration(teamId)}
          onSwitchToTeam={(newTeam, mentor) => onSwitchToTeam && onSwitchToTeam(newTeam, mentor)}
          onNavigateToMascot={() => onOpenMascotWithTopic('Дедлайны этапов чемпионата')}
        />
      )}
    </div>
  );
};
