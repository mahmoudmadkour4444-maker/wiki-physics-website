import { create } from 'zustand'

/* ── Data Types ── */
export interface Video {
  id: string
  grade: number
  moduleId: string
  moduleName: string
  order: number
  title: string
  desc: string
  duration: string
  videoId: string | null
  youtubeUrl?: string
  status: 'available' | 'locked'
  views?: number
  publishedAt?: string
}

export interface WikiCode {
  code: string
  name: string
  grade: number
  status: 'active' | 'inactive'
  usageLimit: number
  usedCount: number
  expiresAt: string
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  desc: string
  time: string
  read: boolean
}

export interface WikiFile {
  id: string
  name: string
  type: string
  size: string
  module: string
  url: string | null
}

export interface Session {
  code: string
  name: string
  grade: number
  loginAt: number
}

export type Page = 'home' | 'login' | 'about' | 'howto' | 'faq' | 'dashboard'
export type DbView = 'overview' | 'videos' | 'player' | 'notifications' | 'files'
export type AdminView = 'stats' | 'videos' | 'codes' | 'settings'

/* ── Video Data ── */
const VIDEOS: Video[] = [
  { id:"v101", grade:1, moduleId:"m1", moduleName:"الميكانيكا", order:1, title:"مقدمة في الميكانيكا الكلاسيكية", desc:"نبني فيها فهماً حقيقياً لمفهوم القوة والتسارع — بدون حفظ، بالحدس أولاً.", duration:"18:24", videoId:null, status:"available" },
  { id:"v102", grade:1, moduleId:"m1", moduleName:"الميكانيكا", order:2, title:"قوانين نيوتن الثلاثة", desc:"كل قانون وقصته ولماذا هو مبني على ما قبله. القانون الثالث وسوء فهمه الشائع.", duration:"24:10", videoId:null, status:"available" },
  { id:"v103", grade:1, moduleId:"m1", moduleName:"الميكانيكا", order:3, title:"الطاقة والشغل", desc:"الفرق بين الشغل الفيزيائي والمفهوم اليومي — وكيف تنتقل الطاقة.", duration:"20:45", videoId:null, status:"available" },
  { id:"v104", grade:1, moduleId:"m2", moduleName:"الحركة", order:1, title:"الحركة المستقيمة المتسارعة", desc:"معادلات الحركة من الصفر — اشتقاق، تفسير، وتطبيق.", duration:"22:00", videoId:null, status:"available" },
  { id:"v105", grade:1, moduleId:"m2", moduleName:"الحركة", order:2, title:"الحركة المقذوفة", desc:"تحليل الحركة لمركبتين مستقلتين — لماذا تسقط الأجسام بنفس الوقت.", duration:"19:30", videoId:null, status:"locked" },
  { id:"v201", grade:2, moduleId:"m3", moduleName:"الحرارة", order:1, title:"مقدمة في الديناميكا الحرارية", desc:"الحرارة مقابل درجة الحرارة — فهم الفرق الجوهري الذي يُشكّل كل شيء بعده.", duration:"21:15", videoId:null, status:"available" },
  { id:"v202", grade:2, moduleId:"m3", moduleName:"الحرارة", order:2, title:"القانون الأول للديناميكا الحرارية", desc:"حفظ الطاقة في الأنظمة الحرارية — تطبيقات على المحركات والثلاجات.", duration:"25:40", videoId:null, status:"available" },
  { id:"v203", grade:2, moduleId:"m3", moduleName:"الحرارة", order:3, title:"القانون الثاني والإنتروبيا", desc:"لماذا لا يمكن عكس الزمن — الإنتروبيا بطريقة بسيطة وعميقة.", duration:"28:00", videoId:null, status:"available" },
  { id:"v204", grade:2, moduleId:"m4", moduleName:"الغازات", order:1, title:"قانون الغاز المثالي", desc:"PV = nRT من أين جاء وماذا يعني فعلاً — ربط نظري وعملي.", duration:"17:55", videoId:null, status:"available" },
  { id:"v205", grade:2, moduleId:"m4", moduleName:"الغازات", order:2, title:"العمليات الحرارية", desc:"إيزوثيرمية، أدياباتية، إيزوبارية — على المخطط PV.", duration:"23:10", videoId:null, status:"locked" },
  { id:"v301", grade:3, moduleId:"m5", moduleName:"الكهرباء", order:1, title:"مقدمة في الكهرباء والشحنة", desc:"الشحنة الكهربائية ومن أين تأتي — قوانين كولوم واشتقاقها.", duration:"20:00", videoId:null, status:"available" },
  { id:"v302", grade:3, moduleId:"m5", moduleName:"الكهرباء", order:2, title:"المجال الكهربائي", desc:"تصور المجال — خطوط القوة وكثافتها وما تخبرنا به.", duration:"22:30", videoId:null, status:"available" },
  { id:"v303", grade:3, moduleId:"m5", moduleName:"الكهرباء", order:3, title:"الجهد الكهربائي", desc:"الفرق بين الجهد والمجال — الطاقة الكامنة الكهربائية.", duration:"19:45", videoId:null, status:"available" },
  { id:"v304", grade:3, moduleId:"m6", moduleName:"المغناطيسية", order:1, title:"المجال المغناطيسي وقانون بيوت-سافار", desc:"كيف تولد التيارات مجالات — قانون بيوت-سافار خطوة خطوة.", duration:"26:20", videoId:null, status:"available" },
  { id:"v305", grade:3, moduleId:"m6", moduleName:"المغناطيسية", order:2, title:"الحث الكهرومغناطيسي", desc:"قانون فارادي وطريقة تفكير ماكسويل — كيف يولد التيار.", duration:"24:00", videoId:null, status:"locked" },
]

const NOTIFICATIONS: Notification[] = [
  { id:"n1", title:"درس جديد أُضيف", desc:"تم إضافة درس 'قوانين نيوتن الثلاثة' في وحدة الميكانيكا للسنة الأولى.", time:"منذ ساعتين", read:false },
  { id:"n2", title:"تحديث المنصة", desc:"تم تحسين سرعة التحميل وإضافة شريط التقدم للدروس. استكشف الميزات الجديدة.", time:"منذ يوم", read:false },
  { id:"n3", title:"وحدة جديدة قريباً", desc:"وحدة البصريات ستُطلق قريباً للسنتين الأولى والثانية. ترقب الإشعار.", time:"منذ 3 أيام", read:false },
  { id:"n4", title:"مرحباً بك في المنصة", desc:"يسعدنا انضمامك لويكي فيزياء. ابدأ برحلتك من الوحدة الأولى.", time:"منذ أسبوع", read:true },
]

const FILES: Record<number, WikiFile[]> = {
  1: [
    { id:'f101', name:'ملخص الميكانيكا الكلاسيكية', type:'pdf', size:'2.4 MB', module:'الميكانيكا', url:null },
    { id:'f102', name:'ورقة قوانين نيوتن', type:'pdf', size:'1.1 MB', module:'الميكانيكا', url:null },
    { id:'f103', name:'تمارين محلولة — الطاقة والشغل', type:'pdf', size:'3.2 MB', module:'الميكانيكا', url:null },
    { id:'f104', name:'معادلات الحركة — المعادلات الأساسية', type:'pdf', size:'0.8 MB', module:'الحركة', url:null },
    { id:'f105', name:'مسائل الحركة المقذوفة', type:'pdf', size:'1.5 MB', module:'الحركة', url:null },
  ],
  2: [
    { id:'f201', name:'ملخص الديناميكا الحرارية', type:'pdf', size:'2.8 MB', module:'الحرارة', url:null },
    { id:'f202', name:'جدول القوانين الحرارية', type:'pdf', size:'0.6 MB', module:'الحرارة', url:null },
    { id:'f203', name:'تمارين قانون الغاز المثالي', type:'pdf', size:'1.9 MB', module:'الغازات', url:null },
  ],
  3: [
    { id:'f301', name:'ملخص الكهرباء والمغناطيسية', type:'pdf', size:'3.5 MB', module:'الكهرباء', url:null },
    { id:'f302', name:'قوانين كولوم والمجال الكهربائي', type:'pdf', size:'1.2 MB', module:'الكهرباء', url:null },
    { id:'f303', name:'تمارين الحث الكهرومغناطيسي', type:'pdf', size:'2.1 MB', module:'المغناطيسية', url:null },
  ],
}

/* ── Helper: localStorage ── */
function loadProgress(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('wiki_progress') || '{}') } catch { return {} }
}
function saveProgress(store: Record<string, number>) {
  if (typeof window === 'undefined') return
  localStorage.setItem('wiki_progress', JSON.stringify(store))
}
function loadSession(): Session | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('wiki_session') || 'null') } catch { return null }
}
function saveSession(s: Session | null) {
  if (typeof window === 'undefined') return
  if (s) localStorage.setItem('wiki_session', JSON.stringify(s))
  else localStorage.removeItem('wiki_session')
}
function loadAdminCodes(): WikiCode[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('wiki_admin_codes') || '[]') } catch { return [] }
}
function saveAdminCodes(codes: WikiCode[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('wiki_admin_codes', JSON.stringify(codes))
}

/* ── Store ── */
interface WikiStore {
  // Navigation
  currentPage: Page
  setCurrentPage: (p: Page) => void

  // Auth
  session: Session | null
  setSession: (s: Session | null) => void
  login: (code: string, name: string, grade: number) => void
  logout: () => void

  // Dashboard
  currentDbView: DbView
  setDbView: (v: DbView) => void
  previousDbView: DbView
  currentGrade: number
  setCurrentGrade: (g: number) => void
  currentVideoId: string | null
  setCurrentVideoId: (id: string | null) => void

  // Data
  videos: Video[]
  notifications: Notification[]
  files: Record<number, WikiFile[]>

  // Progress
  progressStore: Record<string, number>
  markProgress: (videoId: string, pct: number) => void

  // Admin
  isAdminLoggedIn: boolean
  setAdminLoggedIn: (v: boolean) => void
  adminCodes: WikiCode[]
  addAdminCode: (code: WikiCode) => void
  removeAdminCode: (code: string) => void
  toggleCodeStatus: (code: string) => void
  adminView: AdminView
  setAdminView: (v: AdminView) => void
  addVideo: (v: Video) => void
  removeVideo: (id: string) => void
  updateVideo: (id: string, updates: Partial<Video>) => void

  // Notification actions
  markNotifRead: (id: string) => void
  markAllNotifsRead: () => void
  addNotification: (n: Notification) => void

  // Mobile nav
  mobileNavOpen: boolean
  setMobileNavOpen: (v: boolean) => void

  // Get code popup
  getCodePopupOpen: boolean
  setGetCodePopupOpen: (v: boolean) => void

  // Init
  init: () => void
}

export const useWikiStore = create<WikiStore>((set, get) => ({
  currentPage: 'home',
  setCurrentPage: (p) => {
    if (p === 'dashboard' && !get().session) p = 'login'
    set({ currentPage: p })
  },

  session: null,
  setSession: (s) => set({ session: s }),
  login: (code, name, grade) => {
    const s: Session = { code, name, grade, loginAt: Date.now() }
    saveSession(s)
    set({ session: s, currentPage: 'dashboard' })
  },
  logout: () => {
    saveSession(null)
    set({ session: null, currentPage: 'home', currentDbView: 'overview' })
  },

  currentDbView: 'overview',
  setDbView: (v) => set((s) => ({ currentDbView: v, previousDbView: s.currentDbView })),
  previousDbView: 'videos',
  currentGrade: 1,
  setCurrentGrade: (g) => set({ currentGrade: g }),
  currentVideoId: null,
  setCurrentVideoId: (id) => set({ currentVideoId: id }),

  videos: VIDEOS,
  notifications: NOTIFICATIONS,
  files: FILES,

  progressStore: {},
  markProgress: (videoId, pct) => {
    const store = { ...get().progressStore, [videoId]: pct }
    saveProgress(store)
    set({ progressStore: store })
  },

  isAdminLoggedIn: false,
  setAdminLoggedIn: (v) => set({ isAdminLoggedIn: v }),
  adminCodes: [],
  addAdminCode: (code) => {
    const codes = [...get().adminCodes, code]
    saveAdminCodes(codes)
    set({ adminCodes: codes })
  },
  removeAdminCode: (code) => {
    const codes = get().adminCodes.filter(c => c.code !== code)
    saveAdminCodes(codes)
    set({ adminCodes: codes })
  },
  toggleCodeStatus: (code) => {
    const codes = get().adminCodes.map(c =>
      c.code === code ? { ...c, status: c.status === 'active' ? 'inactive' as const : 'active' as const } : c
    )
    saveAdminCodes(codes)
    set({ adminCodes: codes })
  },
  adminView: 'stats',
  setAdminView: (v) => set({ adminView: v }),

  addVideo: (v) => set((s) => ({ videos: [...s.videos, v] })),
  removeVideo: (id) => set((s) => ({ videos: s.videos.filter(v => v.id !== id) })),
  updateVideo: (id, updates) => set((s) => ({
    videos: s.videos.map(v => v.id === id ? { ...v, ...updates } : v)
  })),

  markNotifRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllNotifsRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true }))
  })),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),

  mobileNavOpen: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  getCodePopupOpen: false,
  setGetCodePopupOpen: (v) => set({ getCodePopupOpen: v }),

  init: () => {
    const session = loadSession()
    const progress = loadProgress()
    const adminCodes = loadAdminCodes()
    set({
      session,
      progressStore: progress,
      adminCodes,
      currentPage: session ? 'dashboard' : 'home',
      currentGrade: session?.grade || 1,
    })
  },
}))
