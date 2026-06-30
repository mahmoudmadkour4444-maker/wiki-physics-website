'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, BookOpen, Video, Users, Key, Settings, LogOut, Plus,
  Edit3, Trash2, Eye, Lock, Unlock, Search, Menu, X, ChevronLeft,
  ChevronRight, Play, Upload, Link, FileVideo, CheckCircle, XCircle,
  Clock, AlertCircle, Send, Phone, GraduationCap, Monitor,
  MessageSquare, BarChart3, Bell, Home, ClipboardList, User,
  RefreshCw, Copy, ExternalLink, Smartphone, Wifi, Inbox, Zap,
  LayoutGrid, List, Atom, Sparkles, Target, Award, Rocket, Quote,
  Headphones, ShieldCheck, TrendingUp, Star, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';


// ========== TYPES ==========
interface Course {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  price: string;
  stage: string;
  order: number;
  active: boolean;
  createdAt: string;
  lessons?: Lesson[];
  _count?: { lessons: number; keys: number; requests: number };
}

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  videoType: string;
  videoUrl?: string | null;
  filePath?: string | null;
  courseId: string;
  order: number;
  duration?: string | null;
  active: boolean;
  course?: Course;
}

interface Student {
  id: string;
  name: string;
  username: string;
  phone: string;
  whatsapp: string;
  stage: string;
  fingerprint?: string | null;
  createdAt: string;
  _count?: { sessions: number; requests: number; activations: number };
}

interface InboxMessage {
  id: string;
  studentId: string;
  title: string;
  body: string;
  type: string;
  courseId?: string | null;
  keyId?: string | null;
  code?: string | null;
  read: boolean;
  createdAt: string;
  course?: { title: string } | null;
}

interface AccessKey {
  id: string;
  code: string;
  courseId: string;
  maxDevices: number;
  durationDays: number;
  active: boolean;
  createdAt: string;
  course?: Course;
  activations?: KeyActivation[];
}

interface KeyActivation {
  id: string;
  keyId: string;
  studentId: string;
  fingerprint: string;
  activatedAt: string;
  expiresAt: string;
  student?: Student;
}

interface AccessRequest {
  id: string;
  studentId: string;
  courseId: string;
  code?: string | null;
  status: string;
  whatsapp: string;
  message?: string | null;
  createdAt: string;
  student?: Student;
  course?: Course;
}

interface AdminUser {
  id: string;
  username: string;
}

type Page = 'home' | 'courses' | 'course-detail' | 'lesson' | 'admin' | 'login' | 'register' | 'profile';

// ========== DEVICE FINGERPRINT ==========
async function getFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const nav = navigator as Record<string, unknown>;
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || '',
    canvasData.slice(-50)
  ].join('|');

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ========== YOUTUBE HELPERS ==========
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// ========== RANDOM CODE GENERATOR ==========
function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return segments.join('-');
}

// ========== MAIN APP ==========
export default function WikiPlatform() {
  const { toast } = useToast();

  // Theme
  const [darkMode, setDarkMode] = useState(true);

  // Navigation
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Auth
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [activeCourses, setActiveCourses] = useState<{ courseId: string; courseTitle?: string; expiresAt: string }[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>('');

  // Admin tab
  const [adminTab, setAdminTab] = useState('dashboard');

  // Notifications inbox
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Student inbox
  const [studentInbox, setStudentInbox] = useState<InboxMessage[]>([]);
  const [showStudentInbox, setShowStudentInbox] = useState(false);
  const [studentUnreadCount, setStudentUnreadCount] = useState(0);

  // Batch key generation
  const [batchKeyCount, setBatchKeyCount] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showGeneratedCodes, setShowGeneratedCodes] = useState(false);

  // Secret admin access - 7 clicks on logo
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog states
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showEditLesson, setShowEditLesson] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form states
  const [studentForm, setStudentForm] = useState({ name: '', username: '', password: '', phone: '', whatsapp: '', stage: 'أولى' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', image: '', price: 'مجاني', stage: 'أولى' });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoType: 'youtube', videoUrl: '', courseId: '', order: 0, duration: '' });
  const [keyForm, setKeyForm] = useState({ courseId: '', maxDevices: 1, durationDays: 30, code: '' });
  const [requestForm, setRequestForm] = useState({ courseId: '', code: '', whatsapp: '', message: '' });
  const [accessCode, setAccessCode] = useState('');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize fingerprint
  useEffect(() => {
    getFingerprint().then(fp => setFingerprint(fp));
  }, []);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ========== API FUNCTIONS ==========
  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data.filter((c: Course) => c.active));
    } catch (e) { console.error(e); }
  }, []);

  const checkAdminSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/verify');
      const data = await res.json();
      if (data.authenticated) setAdmin(data.admin);
    } catch (e) { console.error(e); }
  }, []);

  const checkStudentSession = useCallback(async () => {
    try {
      const res = await fetch('/api/students/session');
      const data = await res.json();
      if (data.authenticated) {
        setStudent(data.student);
        setActiveCourses(data.activeCourses || []);
        // Load student inbox
        loadStudentInbox(data.student.id);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadStudentInbox = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/inbox?studentId=${sid}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudentInbox(data);
        setStudentUnreadCount(data.filter((m: InboxMessage) => !m.read).length);
      }
      const countRes = await fetch(`/api/inbox?studentId=${sid}&action=unread`);
      const countData = await countRes.json();
      if (typeof countData.count === 'number') setStudentUnreadCount(countData.count);
    } catch (e) { console.error(e); }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (Array.isArray(data)) {
        const pendingRequests = data.filter((r: any) => r.status === 'pending');
        setNotifications(pendingRequests);
        setUnreadCount(pendingRequests.length);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      if (adminTab === 'dashboard') {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        setDashboardData(data);
      } else if (adminTab === 'courses') {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (Array.isArray(data)) setCourses(data);
      } else if (adminTab === 'students') {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (Array.isArray(data)) setStudents(data);
      } else if (adminTab === 'keys') {
        const res = await fetch('/api/keys');
        const data = await res.json();
        if (Array.isArray(data)) setKeys(data);
      } else if (adminTab === 'requests') {
        const res = await fetch('/api/requests');
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
      } else if (adminTab === 'settings') {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
      }
      loadNotifications();
    } catch (e) { console.error(e); }
  }, [adminTab, loadNotifications]);

  // Check existing sessions
  useEffect(() => {
    startTransition(() => {
      checkAdminSession();
      checkStudentSession();
    });
  }, [checkAdminSession, checkStudentSession]);

  // Load data when needed
  useEffect(() => {
    if (currentPage === 'home' || currentPage === 'courses') {
      startTransition(() => { loadCourses(); });
    }
  }, [currentPage, loadCourses]);

  useEffect(() => {
    if (admin && currentPage === 'admin') {
      startTransition(() => { loadAdminData(); });
    }
  }, [admin, currentPage, adminTab, loadAdminData]);

  // Poll for new notifications every 15 seconds when admin is logged in
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [admin, loadNotifications]);

  // ========== AUTH HANDLERS ==========
  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      if (data.success) {
        setAdmin(data.admin);
        setShowAdminLogin(false);
        setCurrentPage('admin');
        toast({ title: 'تم تسجيل الدخول بنجاح', description: `مرحباً ${data.admin.username}` });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleStudentRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...studentForm, fingerprint, deviceInfo: navigator.userAgent.slice(0, 100) })
      });
      const data = await res.json();
      if (data.success) {
        setStudent(data.student);
        setActiveCourses(data.activeCourses || []);
        setShowRegister(false);
        toast({ title: 'تم التسجيل بنجاح', description: `مرحباً ${data.student.name}` });
        loadStudentInbox(data.student.id);
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleStudentLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm, fingerprint, deviceInfo: navigator.userAgent.slice(0, 100) })
      });
      const data = await res.json();
      if (data.success) {
        setStudent(data.student);
        setActiveCourses(data.activeCourses || []);
        setShowStudentLogin(false);
        toast({ title: 'تم تسجيل الدخول', description: `مرحباً ${data.student.name}` });
        loadStudentInbox(data.student.id);
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleStudentLogout = async () => {
    try {
      await fetch('/api/students/logout', { method: 'POST' });
      setStudent(null);
      setActiveCourses([]);
      setCurrentPage('home');
      toast({ title: 'تم تسجيل الخروج' });
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const handleAdminLogout = async () => {
    setAdmin(null);
    setCurrentPage('home');
    toast({ title: 'تم تسجيل خروج الأدمن' });
  };

  // ========== COURSE HANDLERS ==========
  const handleAddCourse = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm)
      });
      const data = await res.json();
      if (data.id) {
        setShowAddCourse(false);
        setCourseForm({ title: '', description: '', image: '', price: 'مجاني', stage: 'أولى' });
        loadAdminData();
        toast({ title: 'تم إضافة الكورس بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleEditCourse = async () => {
    if (!editingCourse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm)
      });
      const data = await res.json();
      if (data.id) {
        setShowEditCourse(false);
        setEditingCourse(null);
        loadAdminData();
        toast({ title: 'تم تعديل الكورس بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;
    try {
      await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      loadAdminData();
      toast({ title: 'تم حذف الكورس' });
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // ========== LESSON HANDLERS ==========
  const handleAddLesson = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonForm)
      });
      const data = await res.json();
      if (data.id) {
        setShowAddLesson(false);
        setLessonForm({ title: '', description: '', videoType: 'youtube', videoUrl: '', courseId: '', order: 0, duration: '' });
        loadAdminData();
        toast({ title: 'تم إضافة الدرس بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleEditLesson = async () => {
    if (!editingLesson) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonForm.title,
          description: lessonForm.description || null,
          videoType: lessonForm.videoType,
          videoUrl: lessonForm.videoUrl || null,
          order: lessonForm.order,
          duration: lessonForm.duration || null
        })
      });
      const data = await res.json();
      if (data.id) {
        setShowEditLesson(false);
        setEditingLesson(null);
        loadAdminData();
        loadCourses();
        toast({ title: 'تم تعديل الدرس بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      loadAdminData();
      toast({ title: 'تم حذف الدرس' });
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // ========== KEY HANDLERS ==========
  const handleAddKey = async () => {
    setLoading(true);
    try {
      const count = Math.min(Math.max(batchKeyCount || 1, 1), 50);
      const createdCodes: string[] = [];
      for (let i = 0; i < count; i++) {
        const autoCode = generateRandomCode();
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...keyForm, code: autoCode })
        });
        const data = await res.json();
        if (data.id) {
          createdCodes.push(data.code || autoCode);
        } else {
          toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
          break;
        }
      }
      if (createdCodes.length > 0) {
        setShowAddKey(false);
        setKeyForm({ courseId: '', maxDevices: 1, durationDays: 30, code: '' });
        setGeneratedCodes(createdCodes);
        setShowGeneratedCodes(true);
        setBatchKeyCount(1);
        loadAdminData();
        if (createdCodes.length === 1) {
          toast({ title: 'تم إنشاء المفتاح بنجاح', description: `الكود: ${createdCodes[0]}` });
        } else {
          toast({ title: `تم إنشاء ${createdCodes.length} مفتاح بنجاح` });
        }
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleActivateKey = async () => {
    if (!student || !accessCode.trim()) return;
    setLoading(true);
    try {
      const validateRes = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim(), studentId: student.id, courseId: selectedCourseId || undefined })
      });
      const validateData = await validateRes.json();

      if (validateData.alreadyActive) {
        toast({ title: 'الكود مُفعّل مسبقاً', description: `ينتهي في ${new Date(validateData.expiresAt).toLocaleDateString('ar-EG')}` });
        checkStudentSession();
        setLoading(false);
        return;
      }

      if (!validateData.valid && !validateData.canActivate) {
        toast({ title: 'خطأ', description: validateData.error || 'الكود غير صالح', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const activateRes = await fetch('/api/keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim(), studentId: student.id, fingerprint })
      });
      const activateData = await activateRes.json();

      if (activateData.success) {
        setAccessCode('');
        checkStudentSession();
        toast({ title: 'تم تفعيل الكود بنجاح!', description: `ينتهي في ${new Date(activateData.expiresAt).toLocaleDateString('ar-EG')}` });
      } else {
        toast({ title: 'خطأ', description: activateData.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    }
    setLoading(false);
  };

  // ========== REQUEST HANDLER ==========
  const handleSendRequest = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          courseId: requestForm.courseId,
          code: requestForm.code || null,
          whatsapp: requestForm.whatsapp || student.whatsapp,
          message: requestForm.message || null
        })
      });
      const data = await res.json();
      if (data.id) {
        setShowAccessRequest(false);
        setRequestForm({ courseId: '', code: '', whatsapp: '', message: '' });
        toast({ title: 'تم إرسال الطلب بنجاح', description: 'سيتم الرد عليك في أقرب وقت' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
    setLoading(false);
  };

  // ========== VIDEO UPLOAD ==========
  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.filePath) {
          setLessonForm(prev => ({ ...prev, videoUrl: data.filePath, videoType: 'upload' }));
          toast({ title: 'تم رفع الفيديو بنجاح' });
        }
      } else {
        toast({ title: 'خطأ', description: 'فشل رفع الفيديو', variant: 'destructive' });
      }
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      toast({ title: 'خطأ', description: 'فشل رفع الفيديو', variant: 'destructive' });
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.send(formData);
  };

  // ========== REQUEST STATUS ==========
  const handleUpdateRequest = async (id: string, status: string) => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadAdminData();
      toast({ title: status === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب' });
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // ========== SETTINGS ==========
  const handleSaveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      toast({ title: 'تم حفظ الإعدادات بنجاح' });
    } catch (e) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // ========== NAVIGATION HELPERS ==========
  const navigateToCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentPage('course-detail');
  };

  const navigateToLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentPage('lesson');
  };

  const hasAccessToCourse = (courseId: string) => {
    return activeCourses.some(ac => ac.courseId === courseId && new Date(ac.expiresAt) > new Date());
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedLesson = selectedCourse?.lessons?.find(l => l.id === selectedLessonId);

  // ========== STYLE HELPERS ==========
  const bg = darkMode ? 'bg-[#050505]' : 'bg-gray-50';
  const bgCard = darkMode ? 'bg-[#111111] border-[rgba(255,122,0,0.18)]' : 'bg-white border-gray-200';
  const bgSecondary = darkMode ? 'bg-[#141414]' : 'bg-gray-100';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-white/60' : 'text-gray-500';
  const textMuted = darkMode ? 'text-white/40' : 'text-gray-400';
  const borderColor = darkMode ? 'border-[rgba(255,122,0,0.18)]' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900';

  // ===== DEVELOPER SIGNATURE COMPONENT =====
  const DevSignature = () => (
    <div className={`py-4 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span className={textMuted}>تم التطوير بواسطة</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <a href="https://t.me/MCV_M" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 hover:bg-[#FF7A00]/20 transition-colors">
            <span>dev:</span><span className="font-bold">Mahmoud</span>
            <span className="text-white/30">|</span><span>t.me/MCV_M</span>
            <span className="text-white/30">|</span><span>WS:@MCV_M</span>
          </a>
          <a href="https://t.me/MCV_W" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 hover:bg-[#FF7A00]/20 transition-colors">
            <span>dev:</span><span className="font-bold">Youdef Emad</span>
            <span className="text-white/30">|</span><span>t.me/MCV_W</span>
            <span className="text-white/30">|</span><span>WS:@MCV_W</span>
          </a>
        </div>
      </div>
    </div>
  );

  // Admin tab config
  const adminTabs = [
    { id: 'dashboard', icon: <BarChart3 className="w-5 h-5" />, label: 'إحصائيات' },
    { id: 'courses', icon: <BookOpen className="w-5 h-5" />, label: 'كورسات' },
    { id: 'lessons', icon: <Video className="w-5 h-5" />, label: 'دروس' },
    { id: 'students', icon: <Users className="w-5 h-5" />, label: 'طلاب' },
    { id: 'keys', icon: <Key className="w-5 h-5" />, label: 'أكواد' },
    { id: 'requests', icon: <ClipboardList className="w-5 h-5" />, label: 'طلبات' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'إعدادات' },
  ];

  // ========== ADMIN CONTENT RENDER ==========
  const renderAdminContent = () => (<>
    {/* Dashboard Tab */}
    {adminTab === 'dashboard' && dashboardData && (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الإحصائيات</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'الكورسات', value: dashboardData.stats.courses, icon: <BookOpen className="w-5 h-5" />, color: '#FF7A00' },
            { label: 'الدروس', value: dashboardData.stats.lessons, icon: <Video className="w-5 h-5" />, color: '#4ade80' },
            { label: 'الطلاب', value: dashboardData.stats.students, icon: <Users className="w-5 h-5" />, color: '#60a5fa' },
            { label: 'المفاتيح', value: dashboardData.stats.keys, icon: <Key className="w-5 h-5" />, color: '#f87171' },
            { label: 'طلبات معلقة', value: dashboardData.stats.requests, icon: <Bell className="w-5 h-5" />, color: '#fbbf24' },
            { label: 'اشتراكات نشطة', value: dashboardData.stats.activeKeys, icon: <Wifi className="w-5 h-5" />, color: '#34d399' },
          ].map((stat, i) => (
            <Card key={i} className={`p-4 ${bgCard}`}>
              <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`text-sm ${textMuted}`}>{stat.label}</div>
            </Card>
          ))}
        </div>

        {dashboardData.recentRequests?.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#FF7A00]" /> آخر الطلبات
            </h3>
            <div className="space-y-2">
              {dashboardData.recentRequests.map((req: AccessRequest) => (
                <Card key={req.id} className={`p-3 ${bgCard}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{req.student?.name}</span>
                      <span className={`text-sm mr-2 ${textMuted}`}>— {req.course?.title}</span>
                    </div>
                    <Badge className={req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      req.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                      {req.status === 'pending' ? 'معلق' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {dashboardData.recentStudents?.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF7A00]" /> آخر الطلاب المسجلين
            </h3>
            <div className="space-y-2">
              {dashboardData.recentStudents.map((s: Student) => (
                <Card key={s.id} className={`p-3 ${bgCard}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center text-sm font-bold">{s.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className={`text-xs ${textMuted}`} dir="ltr">{s.phone}</p>
                      </div>
                    </div>
                    <span className={`text-xs ${textMuted}`}>{new Date(s.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

    {adminTab === 'dashboard' && !dashboardData && (
      <div className="text-center py-20">
        <RefreshCw className={`w-10 h-10 mx-auto mb-4 animate-spin ${textMuted}`} />
        <p className={textSecondary}>جاري تحميل البيانات...</p>
      </div>
    )}

    {/* Courses Tab */}
    {adminTab === 'courses' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">إدارة الكورسات</h2>
          <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black">
                <Plus className="w-4 h-4 ml-2" /> إضافة كورس
              </Button>
            </DialogTrigger>
            <DialogContent className={darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}>
              <DialogHeader>
                <DialogTitle>إضافة كورس جديد</DialogTitle>
                <DialogDescription className="sr-only">نموذج إضافة كورس جديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>اسم الكورس</Label>
                  <Input value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className={inputBg} />
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} className={inputBg} />
                </div>
                <div>
                  <Label>رابط الصورة</Label>
                  <Input value={courseForm.image} onChange={(e) => setCourseForm({...courseForm, image: e.target.value})} className={inputBg} dir="ltr" />
                </div>
                <div>
                  <Label>السعر</Label>
                  <Input value={courseForm.price} onChange={(e) => setCourseForm({...courseForm, price: e.target.value})} className={inputBg} />
                </div>
                <div>
                  <Label>المرحلة الدراسية</Label>
                  <Select value={courseForm.stage} onValueChange={(v) => setCourseForm({...courseForm, stage: v})}>
                    <SelectTrigger className={inputBg}><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أولى">أولى ثانوي</SelectItem>
                      <SelectItem value="ثانية">ثانية ثانوي</SelectItem>
                      <SelectItem value="ثالثة">ثالثة ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={handleAddCourse} disabled={loading}>
                  {loading ? 'جاري الإضافة...' : 'إضافة الكورس'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {courses.map(course => (
            <Card key={course.id} className={`p-4 ${bgCard}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{course.title}</h3>
                    <Badge variant="outline" className="text-xs">{course.price}</Badge>
                    {!course.active && <Badge className="bg-red-500/20 text-red-500 text-xs">معطل</Badge>}
                  </div>
                  <p className={`text-sm ${textSecondary} truncate`}>{course.description}</p>
                  <div className={`flex items-center gap-3 text-xs ${textMuted} mt-1`}>
                    <span>{course._count?.lessons || 0} درس</span>
                    <span>{course._count?.keys || 0} مفتاح</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="text-[#FF7A00]" onClick={() => {
                    setEditingCourse(course);
                    setCourseForm({ title: course.title, description: course.description, image: course.image || '', price: course.price });
                    setShowEditCourse(true);
                  }}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteCourse(course.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )}

    {/* Edit Course Dialog */}
    <Dialog open={showEditCourse} onOpenChange={setShowEditCourse}>
      <DialogContent className={darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}>
        <DialogHeader>
          <DialogTitle>تعديل الكورس</DialogTitle>
          <DialogDescription className="sr-only">نموذج تعديل بيانات الكورس</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>اسم الكورس</Label><Input value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className={inputBg} /></div>
          <div><Label>الوصف</Label><Textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} className={inputBg} /></div>
          <div><Label>رابط الصورة</Label><Input value={courseForm.image} onChange={(e) => setCourseForm({...courseForm, image: e.target.value})} className={inputBg} dir="ltr" /></div>
          <div><Label>السعر</Label><Input value={courseForm.price} onChange={(e) => setCourseForm({...courseForm, price: e.target.value})} className={inputBg} /></div>
          <Button className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={handleEditCourse} disabled={loading}>
            {loading ? 'جاري التعديل...' : 'حفظ التعديلات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Lessons Tab */}
    {adminTab === 'lessons' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">إدارة الدروس</h2>
          <Dialog open={showAddLesson} onOpenChange={setShowAddLesson}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black">
                <Plus className="w-4 h-4 ml-2" /> إضافة درس
              </Button>
            </DialogTrigger>
            <DialogContent className={`max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}`}>
              <DialogHeader>
                <DialogTitle>إضافة درس جديد</DialogTitle>
                <DialogDescription className="sr-only">نموذج إضافة درس جديد بالفيديو</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>عنوان الدرس</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})} className={inputBg} /></div>
                <div><Label>الوصف</Label><Textarea value={lessonForm.description} onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})} className={inputBg} /></div>
                <div>
                  <Label>الكورس</Label>
                  <Select value={lessonForm.courseId} onValueChange={(v) => setLessonForm({...lessonForm, courseId: v})}>
                    <SelectTrigger className={inputBg}><SelectValue placeholder="اختر الكورس" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نوع الفيديو</Label>
                  <Select value={lessonForm.videoType} onValueChange={(v) => setLessonForm({...lessonForm, videoType: v})}>
                    <SelectTrigger className={inputBg}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">يوتيوب</SelectItem>
                      <SelectItem value="external">رابط خارجي</SelectItem>
                      <SelectItem value="upload">رفع فيديو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {lessonForm.videoType !== 'upload' ? (
                  <div>
                    <Label>رابط الفيديو</Label>
                    <Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})} className={inputBg} dir="ltr" placeholder="https://..." />
                  </div>
                ) : (
                  <div>
                    <Label>رفع فيديو</Label>
                    <div className={`border-2 border-dashed ${borderColor} rounded-xl p-8 text-center`}>
                      {uploading ? (
                        <div className="space-y-3">
                          <RefreshCw className="w-8 h-8 mx-auto text-[#FF7A00] animate-spin" />
                          <p className="text-sm">جاري الرفع... {uploadProgress}%</p>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      ) : lessonForm.videoUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                          <p className="text-sm text-green-500">تم رفع الفيديو بنجاح</p>
                          <Button size="sm" variant="outline" onClick={() => setLessonForm({...lessonForm, videoUrl: ''})}>إعادة الرفع</Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto text-[#FF7A00] mb-2" />
                          <p className={`text-sm ${textSecondary}`}>اضغط لاختيار فيديو</p>
                          <p className={`text-xs ${textMuted}`}>MP4, MOV, AVI — حتى 500MB</p>
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVideoUpload(file);
                          }} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>الترتيب</Label><Input type="number" value={lessonForm.order} onChange={(e) => setLessonForm({...lessonForm, order: parseInt(e.target.value) || 0})} className={inputBg} /></div>
                  <div><Label>المدة</Label><Input value={lessonForm.duration} onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})} className={inputBg} placeholder="مثال: 15:30" /></div>
                </div>
                <Button className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={handleAddLesson} disabled={loading || uploading}>
                  {loading ? 'جاري الإضافة...' : 'إضافة الدرس'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {courses.flatMap(c => (c.lessons || []).map(l => ({ ...l, courseName: c.title }))).sort((a, b) => a.order - b.order).map(lesson => (
            <Card key={lesson.id} className={`p-4 ${bgCard}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Video className={`w-4 h-4 shrink-0 ${lesson.videoType === 'youtube' ? 'text-red-500' : lesson.videoType === 'upload' ? 'text-green-500' : 'text-blue-500'}`} />
                    <h3 className="font-medium truncate">{lesson.title}</h3>
                    {!lesson.active && <Badge className="bg-red-500/20 text-red-500 text-xs">معطل</Badge>}
                  </div>
                  <p className={`text-sm ${textMuted} mt-1`}>
                    {lesson.courseName} • {lesson.videoType === 'youtube' ? 'يوتيوب' : lesson.videoType === 'upload' ? 'مرفوع' : 'رابط خارجي'}
                    {lesson.duration ? ` • ${lesson.duration}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="text-[#FF7A00]" onClick={() => {
                    setEditingLesson(lesson);
                    setLessonForm({
                      title: lesson.title, description: lesson.description || '', videoType: lesson.videoType,
                      videoUrl: lesson.videoUrl || lesson.filePath || '', courseId: lesson.courseId,
                      order: lesson.order, duration: lesson.duration || ''
                    });
                    setShowEditLesson(true);
                  }}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteLesson(lesson.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )}

    {/* Edit Lesson Dialog */}
    <Dialog open={showEditLesson} onOpenChange={setShowEditLesson}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle>تعديل الدرس</DialogTitle>
          <DialogDescription className="sr-only">نموذج تعديل بيانات الدرس</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>عنوان الدرس</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})} className={inputBg} /></div>
          <div><Label>الوصف</Label><Textarea value={lessonForm.description} onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})} className={inputBg} /></div>
          <div>
            <Label>نوع الفيديو</Label>
            <Select value={lessonForm.videoType} onValueChange={(v) => setLessonForm({...lessonForm, videoType: v})}>
              <SelectTrigger className={inputBg}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">يوتيوب</SelectItem>
                <SelectItem value="external">رابط خارجي</SelectItem>
                <SelectItem value="upload">رفع فيديو</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {lessonForm.videoType !== 'upload' ? (
            <div><Label>رابط الفيديو</Label><Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})} className={inputBg} dir="ltr" /></div>
          ) : (
            <div>
              <Label>رفع فيديو جديد</Label>
              <div className={`border-2 border-dashed ${borderColor} rounded-xl p-6 text-center`}>
                {uploading ? (
                  <div className="space-y-2">
                    <RefreshCw className="w-6 h-6 mx-auto text-[#FF7A00] animate-spin" />
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs">جاري الرفع... {uploadProgress}%</p>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-6 h-6 mx-auto text-[#FF7A00] mb-1" />
                    <p className="text-xs">اضغط لاختيار فيديو</p>
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(file);
                    }} />
                  </label>
                )}
              </div>
              {lessonForm.videoUrl && <p className="text-xs text-green-500 mt-2">الفيديو الحالي محفوظ</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>الترتيب</Label><Input type="number" value={lessonForm.order} onChange={(e) => setLessonForm({...lessonForm, order: parseInt(e.target.value) || 0})} className={inputBg} /></div>
            <div><Label>المدة</Label><Input value={lessonForm.duration} onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})} className={inputBg} /></div>
          </div>
          <Button className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={handleEditLesson} disabled={loading || uploading}>
            {loading ? 'جاري التعديل...' : 'حفظ التعديلات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Students Tab */}
    {adminTab === 'students' && (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">إدارة الطلاب ({students.length})</h2>
        <div className="space-y-3">
          {students.map(s => (
            <Card key={s.id} className={`p-4 ${bgCard}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold">{s.name.charAt(0)}</div>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <div className={`flex items-center gap-2 text-xs ${textMuted}`}>
                      <Phone className="w-3 h-3" /> <span dir="ltr">{s.phone}</span>
                      {s.whatsapp && <><MessageSquare className="w-3 h-3 mr-2" /><span dir="ltr">{s.whatsapp}</span></>}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className={`text-xs ${textMuted}`}>{s.stage} — {s.year}</div>
                  <div className={`text-xs ${textMuted}`}>{new Date(s.createdAt).toLocaleDateString('ar-EG')}</div>
                </div>
              </div>
            </Card>
          ))}
          {students.length === 0 && (
            <div className="text-center py-12">
              <Users className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
              <p className={textSecondary}>لا يوجد طلاب مسجلين بعد</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Keys Tab */}
    {adminTab === 'keys' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">إدارة المفاتيح</h2>
          <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black">
                <Plus className="w-4 h-4 ml-2" /> إنشاء مفتاح
              </Button>
            </DialogTrigger>
            <DialogContent className={darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}>
              <DialogHeader>
                <DialogTitle>إنشاء مفتاح جديد</DialogTitle>
                <DialogDescription className="sr-only">نموذج إنشاء مفتاح اشتراك - يتم توليد الكود تلقائياً</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-[#FF7A00]/10' : 'bg-orange-50'} border border-[#FF7A00]/20`}>
                  <p className="text-sm text-[#FF7A00] flex items-center gap-2">
                    <Zap className="w-4 h-4" /> يتم توليد الكود تلقائياً بشكل عشوائي
                  </p>
                </div>
                <div>
                  <Label>الكورس</Label>
                  <Select value={keyForm.courseId} onValueChange={(v) => setKeyForm({...keyForm, courseId: v})}>
                    <SelectTrigger className={inputBg}><SelectValue placeholder="اختر الكورس" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>عدد الأجهزة</Label>
                    <Input type="number" min={1} max={10} value={keyForm.maxDevices} onChange={(e) => setKeyForm({...keyForm, maxDevices: parseInt(e.target.value) || 1})} className={inputBg} />
                  </div>
                  <div>
                    <Label>مدة الاشتراك (يوم)</Label>
                    <Input type="number" min={1} value={keyForm.durationDays} onChange={(e) => setKeyForm({...keyForm, durationDays: parseInt(e.target.value) || 30})} className={inputBg} />
                  </div>
                </div>
                <div>
                  <Label>عدد الأكواد المطلوبة</Label>
                  <Input type="number" min={1} max={50} value={batchKeyCount} onChange={(e) => setBatchKeyCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 50))} className={inputBg} />
                  <p className={`text-xs ${textMuted} mt-1`}>يمكنك إنشاء حتى 50 كود دفعة واحدة</p>
                </div>
                <Button className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={handleAddKey} disabled={loading || !keyForm.courseId}>
                  {loading ? 'جاري الإنشاء...' : `إنشاء ${batchKeyCount > 1 ? `${batchKeyCount} أكواد` : 'مفتاح'}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {keys.map(key => (
            <Card key={key.id} className={`p-4 ${bgCard}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className={`text-sm font-mono px-2 py-0.5 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`} dir="ltr">{key.code}</code>
                    {key.active ? (
                      <Badge className="bg-green-500/20 text-green-500 text-xs"><Unlock className="w-3 h-3 ml-1" />نشط</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 text-xs"><Lock className="w-3 h-3 ml-1" />مستخدم</Badge>
                    )}
                  </div>
                  <p className={`text-sm ${textMuted} mt-1`}>
                    {key.course?.title} • {key.maxDevices} أجهزة • {key.durationDays} يوم
                  </p>
                  {key.activations && key.activations.length > 0 && (
                    <p className={`text-xs ${textMuted} mt-0.5`}>
                      تم التفعيل {key.activations.length} مرة • آخر تفعيل: {new Date(key.activations[key.activations.length - 1].activatedAt).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(key.code);
                    toast({ title: 'تم نسخ الكود' });
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={async () => {
                    if (!confirm('هل تريد حذف هذا المفتاح؟')) return;
                    try {
                      await fetch(`/api/keys/${key.id}`, { method: 'DELETE' });
                      loadAdminData();
                      toast({ title: 'تم حذف المفتاح' });
                    } catch (e) {
                      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
                    }
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {keys.length === 0 && (
            <div className="text-center py-12">
              <Key className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
              <p className={textSecondary}>لا توجد مفاتيح</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Generated Codes Display Dialog */}
    <Dialog open={showGeneratedCodes} onOpenChange={setShowGeneratedCodes}>
      <DialogContent className={darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}>
        <DialogHeader>
          <DialogTitle>الأكواد المُنشأة ({generatedCodes.length})</DialogTitle>
          <DialogDescription className="sr-only">قائمة الأكواد التي تم إنشاؤها</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <div className={`p-3 rounded-lg space-y-2 max-h-60 overflow-y-auto ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
            {generatedCodes.map((code, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm" dir="ltr">{code}</code>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast({ title: 'تم نسخ الكود' });
                }}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={() => {
            navigator.clipboard.writeText(generatedCodes.join('\n'));
            toast({ title: `تم نسخ ${generatedCodes.length} كود` });
          }}>
            <Copy className="w-4 h-4 ml-2" /> نسخ جميع الأكواد
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Requests Tab */}
    {adminTab === 'requests' && (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">طلبات الاشتراك</h2>
        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id} className={`p-4 ${bgCard}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center text-sm font-bold shrink-0">
                      {req.student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{req.student?.name || 'طالب'}</p>
                      <p className={`text-xs ${textMuted}`}>{req.course?.title || 'كورس'}</p>
                    </div>
                  </div>
                  {req.message && (
                    <p className={`text-sm ${textSecondary} mt-2 mr-10`}>{req.message}</p>
                  )}
                  <div className={`flex items-center gap-3 text-xs ${textMuted} mt-2 mr-10`}>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> <span dir="ltr">{req.whatsapp}</span></span>
                    {req.code && <span className="flex items-center gap-1"><Key className="w-3 h-3" /> <code dir="ltr">{req.code}</code></span>}
                    <span>{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    req.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {req.status === 'pending' ? 'معلق' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                  </Badge>
                  {req.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-7 text-xs px-2" onClick={() => handleUpdateRequest(req.id, 'approved')}>
                        <CheckCircle className="w-3 h-3 ml-1" /> قبول
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10 h-7 text-xs px-2" onClick={() => handleUpdateRequest(req.id, 'rejected')}>
                        <XCircle className="w-3 h-3 ml-1" /> رفض
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {requests.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
              <p className={textSecondary}>لا توجد طلبات</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Settings Tab */}
    {adminTab === 'settings' && (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <Card className={`p-6 ${bgCard}`}>
          <div className="space-y-4">
            <div>
              <Label>اسم الموقع</Label>
              <Input value={settings.siteName || ''} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className={inputBg} />
            </div>
            <div>
              <Label>وصف الموقع</Label>
              <Textarea value={settings.siteDescription || ''} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})} className={inputBg} />
            </div>
            <div>
              <Label>رابط مجموعة واتساب</Label>
              <Input value={settings.whatsappGroup || ''} onChange={(e) => setSettings({...settings, whatsappGroup: e.target.value})} className={inputBg} dir="ltr" placeholder="https://chat.whatsapp.com/..." />
            </div>
            <div>
              <Label>رابط قناة تيليجرام</Label>
              <Input value={settings.telegramChannel || ''} onChange={(e) => setSettings({...settings, telegramChannel: e.target.value})} className={inputBg} dir="ltr" placeholder="https://t.me/..." />
            </div>
            <div>
              <Label>Bot Token تيليجرام (للإشعارات)</Label>
              <Input value={settings.telegramBotToken || ''} onChange={(e) => setSettings({...settings, telegramBotToken: e.target.value})} className={inputBg} dir="ltr" />
            </div>
            <div>
              <Label>Chat ID تيليجرام</Label>
              <Input value={settings.telegramChatId || ''} onChange={(e) => setSettings({...settings, telegramChatId: e.target.value})} className={inputBg} dir="ltr" />
            </div>
            <Button className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={handleSaveSettings}>
              حفظ الإعدادات
            </Button>
          </div>
        </Card>
      </div>
    )}
  </>);

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${textPrimary} transition-colors duration-300`} dir="rtl">
      {/* ========== NAVBAR ========== */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl ${darkMode ? 'bg-[#050505]/80 border-b border-[rgba(255,122,0,0.1)]' : 'bg-white/80 border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            setCurrentPage('home');
            // Secret admin access: 7 clicks within 3 seconds
            const newCount = logoClickCount + 1;
            setLogoClickCount(newCount);
            if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
            if (newCount >= 7) {
              setLogoClickCount(0);
              if (admin) {
                setCurrentPage('admin');
              } else {
                setShowAdminLogin(true);
              }
              toast({ title: '🔓 تم فتح لوحة الأدمن' });
            } else {
              logoClickTimer.current = setTimeout(() => setLogoClickCount(0), 3000);
            }
          }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF9D40] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ويكي فيزياء</h1>
              <p className={`text-xs ${textSecondary}`}>Wiki Physics</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('home')} className={currentPage === 'home' ? 'text-[#FF7A00]' : ''}>
              <Home className="w-4 h-4 ml-1" /> الرئيسية
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('courses')} className={currentPage === 'courses' ? 'text-[#FF7A00]' : ''}>
              <BookOpen className="w-4 h-4 ml-1" /> الكورسات
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Admin Notification Bell */}
            {admin && (
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => { setShowInbox(!showInbox); }} className="rounded-full">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>
                  )}
                </Button>
              </div>
            )}

            {/* Student Inbox Bell */}
            {student && !admin && (
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => { setShowStudentInbox(!showStudentInbox); }} className="rounded-full">
                  <Inbox className="w-4 h-4" />
                  {studentUnreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-[#FF7A00] text-black text-xs rounded-full flex items-center justify-center animate-pulse font-bold">{studentUnreadCount}</span>
                  )}
                </Button>
              </div>
            )}

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {student ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage('profile')} className="text-[#FF7A00]">
                  <User className="w-4 h-4 ml-1" /> {student.name}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleStudentLogout}>
                  <LogOut className="w-4 h-4 ml-1" /> خروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowStudentLogin(true)} className="text-[#FF7A00]">
                  <User className="w-4 h-4 ml-1" /> دخول
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowRegister(true)} className="border-[#FF7A00]/30 text-[#FF7A00]">
                  تسجيل
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-1">
            {admin && (
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => { setShowInbox(!showInbox); }} className="rounded-full">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>
                  )}
                </Button>
              </div>
            )}
            {student && !admin && (
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => { setShowStudentInbox(!showStudentInbox); }} className="rounded-full">
                  <Inbox className="w-4 h-4" />
                  {studentUnreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-[#FF7A00] text-black text-[10px] rounded-full flex items-center justify-center animate-pulse font-bold">{studentUnreadCount}</span>
                  )}
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${darkMode ? 'bg-[#0a0a0a]' : 'bg-white'} border-t ${borderColor}`}
            >
              <div className="p-4 flex flex-col gap-2">
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }}>
                  <Home className="w-4 h-4 ml-2" /> الرئيسية
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentPage('courses'); setMobileMenuOpen(false); }}>
                  <BookOpen className="w-4 h-4 ml-2" /> الكورسات
                </Button>
                {student ? (
                  <>
                    <Button variant="ghost" className="justify-start text-[#FF7A00]" onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }}>
                      <User className="w-4 h-4 ml-2" /> {student.name}
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { handleStudentLogout(); setMobileMenuOpen(false); }}>
                      <LogOut className="w-4 h-4 ml-2" /> تسجيل خروج
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start text-[#FF7A00]" onClick={() => { setShowStudentLogin(true); setMobileMenuOpen(false); }}>
                      <User className="w-4 h-4 ml-2" /> تسجيل دخول
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setShowRegister(true); setMobileMenuOpen(false); }}>
                      <User className="w-4 h-4 ml-2" /> حساب جديد
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ========== ADMIN INBOX POPUP ========== */}
      <AnimatePresence>
        {showInbox && admin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-4 md:left-auto md:right-4 z-[60] w-[calc(100%-2rem)] md:w-96 ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)]' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl overflow-hidden`}
          >
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#FF7A00]" />
                <h3 className="font-bold">صندوق البريد</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">{unreadCount} جديد</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowInbox(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
                  <p className={textSecondary}>لا توجد طلبات جديدة</p>
                </div>
              ) : (
                notifications.map((req: any) => (
                  <div key={req.id} className={`p-4 border-b ${borderColor} ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} cursor-pointer transition-colors`} onClick={() => {
                    setShowInbox(false);
                    setCurrentPage('admin');
                    setAdminTab('requests');
                  }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center text-sm font-bold shrink-0">
                        {req.student?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{req.student?.name || 'طالب'}</p>
                        <p className={`text-xs ${textMuted} truncate`}>{req.course?.title || 'كورس'}</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] shrink-0">معلق</Badge>
                    </div>
                    {req.message && (
                      <p className={`text-xs ${textMuted} truncate mr-11`}>{req.message}</p>
                    )}
                    <p className={`text-[10px] ${textMuted} mt-1 mr-11`}>{new Date(req.createdAt).toLocaleString('ar-EG')}</p>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className={`p-3 border-t ${borderColor}`}>
                <Button size="sm" className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={() => {
                  setShowInbox(false);
                  setCurrentPage('admin');
                  setAdminTab('requests');
                }}>
                  عرض جميع الطلبات
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== STUDENT INBOX POPUP ========== */}
      <AnimatePresence>
        {showStudentInbox && student && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-16 left-4 md:left-auto md:right-4 z-50 w-[calc(100%-2rem)] md:w-96 ${bgCard} rounded-2xl border shadow-2xl overflow-hidden`}
          >
            <div className="p-4 border-b border-[#FF7A00]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#FF7A00]" />
                <h3 className="font-bold">صندوق البريد</h3>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowStudentInbox(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {studentInbox.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className={`w-10 h-10 mx-auto mb-3 ${textMuted}`} />
                  <p className={`text-sm ${textSecondary}`}>لا توجد رسائل</p>
                </div>
              ) : (
                studentInbox.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 border-b ${darkMode ? 'border-white/5' : 'border-gray-100'} cursor-pointer hover:bg-[#FF7A00]/5 transition-colors ${!msg.read ? 'bg-[#FF7A00]/5' : ''}`}
                    onClick={async () => {
                      if (!msg.read) {
                        await fetch('/api/inbox', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messageId: msg.id })
                        });
                        if (student.id) loadStudentInbox(student.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'key_code' ? 'bg-green-500/20 text-green-500' : 'bg-[#FF7A00]/20 text-[#FF7A00]'}`}>
                        {msg.type === 'key_code' ? <Key className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${!msg.read ? '' : textSecondary}`}>{msg.title}</span>
                          {!msg.read && <span className="w-2 h-2 rounded-full bg-[#FF7A00] shrink-0" />}
                        </div>
                        <p className={`text-xs ${textMuted} mt-1 line-clamp-2`}>{msg.body}</p>
                        {msg.code && (
                          <div className="mt-2 flex items-center gap-2">
                            <code className="bg-[#FF7A00]/10 text-[#FF7A00] px-2 py-1 rounded text-xs font-bold font-mono tracking-wider" dir="ltr">{msg.code}</code>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(msg.code || '');
                              toast({ title: 'تم نسخ الكود' });
                            }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <p className={`text-[10px] ${textMuted} mt-1`}>{new Date(msg.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* ===== HOME PAGE ===== */}
          {currentPage === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">

              {/* ===== HERO SECTION ===== */}
              <section className="relative overflow-hidden min-h-[100svh] flex flex-col justify-center py-20 md:py-0">
                {/* Mobile: Einstein as background */}
                <div className="md:hidden absolute inset-0">
                  <img
                    src="/einstein-original.jpg"
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay - same as original ::before */}
                  <div className="absolute inset-0 z-[1]" style={{
                    background: [
                      'linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.92) 25%, rgba(5,5,5,0.55) 55%, rgba(5,5,5,0.15) 80%, transparent 100%)',
                      'linear-gradient(to right, rgba(5,5,5,0.5) 0%, transparent 50%)',
                      'linear-gradient(to left, rgba(5,5,5,0.5) 0%, transparent 50%)'
                    ].join(',')
                  }} />
                </div>

                {/* Background grid + radial */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,122,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,0,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                  <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px]" style={{ background: 'radial-gradient(circle, rgba(255,122,0,0.08) 0%, transparent 65%)' }} />
                </div>

                {/* Main hero content - grid layout */}
                <div className="relative z-[2] max-w-[1100px] mx-auto w-full grid grid-cols-1 md:grid-cols-[1fr_400px] gap-10 items-center px-5">
                  {/* Text Content */}
                  <motion.div
                    className="relative z-[2] md:py-20 pt-24 pb-16 md:pb-20 text-center md:text-right"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 mb-8"
                    >
                      <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-pulse" />
                      <span className="text-[#FF7A00] text-xs font-medium border border-[#FF7A00]/18 rounded-full px-3.5 py-1.5 bg-[#FF7A00]/12">منصة الفيزياء الأولى بالعربي</span>
                    </motion.div>

                    <motion.h1
                      className="text-[clamp(34px,8vw,72px)] font-black leading-[1.15] tracking-tight mb-6 text-white"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                    >
                      افهم الفيزياء
                      <br />
                      <em className="not-italic text-[#FF7A00]">بطريقة مختلفة</em>
                    </motion.h1>

                    <motion.p
                      className="text-[clamp(15px,2.5vw,18px)] text-white/70 max-w-[520px] leading-[1.85] mb-11 mx-auto md:mx-0 md:mr-0"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    >
                      منصة تعليمية متخصصة في الفيزياء، تعيد بناء الفهم الحقيقي للمادة من الأساس — بأسلوب واضح وعميق ومصمم للطالب العربي.
                    </motion.p>

                    <motion.div
                      className="flex flex-wrap gap-3.5 justify-center md:justify-start"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.6 }}
                    >
                      <Button
                        size="lg"
                        className="bg-[#FF7A00] hover:bg-[#FF8A10] text-[#050505] font-bold px-7 h-12 text-[15px] rounded-xl"
                        onClick={() => setCurrentPage('courses')}
                      >
                        ابدأ التعلم الآن
                      </Button>
                      {!student && (
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white/15 text-white/80 hover:border-[#FF7A00] hover:text-[#FF7A00] hover:bg-[#FF7A00]/10 px-7 h-12 text-[15px] rounded-xl"
                          onClick={() => setShowRegister(true)}
                        >
                          سجّل الآن مجاناً
                        </Button>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Desktop: Scientist Photo Column (hidden on mobile) */}
                  <div className="hidden md:flex relative h-[500px] items-end justify-center">
                    <div className="relative w-full h-full flex items-end justify-center">
                      {/* Glow behind */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[200px] z-[3] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(255,122,0,0.13) 0%, transparent 70%)', animation: 'scientist-breathe 4s ease-in-out infinite' }} />
                      {/* Einstein Photo */}
                      <motion.img
                        src="/einstein-original.jpg"
                        alt="ألبرت آينشتاين"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-full object-cover object-top z-[1] rounded-none"
                        style={{
                          mixBlendMode: 'luminosity',
                          filter: 'brightness(0.82) contrast(1.08) saturate(0.55) sepia(0.18) drop-shadow(0 0 40px rgba(255,122,0,0.22)) drop-shadow(0 0 12px rgba(255,122,0,0.10))'
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                      />
                      {/* Fade Mask - blends photo into dark background */}
                      <div className="absolute inset-0 z-[2]" style={{
                        background: [
                          'linear-gradient(to top, #050505 0%, transparent 22%)',
                          'linear-gradient(to right, #050505 0%, transparent 18%)',
                          'linear-gradient(to left, #050505 0%, transparent 18%)',
                          'linear-gradient(to bottom, #050505 0%, transparent 12%)'
                        ].join(',')
                      }} />
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== STATS BAR ===== */}
              <section className={`py-8 border-y ${darkMode ? 'border-[#FF7A00]/10 bg-[#080808]' : 'border-orange-200 bg-orange-50/50'}`}>
                <div className="max-w-7xl mx-auto px-4">
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6"
                  >
                    {[
                      { icon: <BookOpen className="w-7 h-7" />, value: courses.length, label: 'كورس متاح', color: 'text-[#FF7A00]' },
                      { icon: <Video className="w-7 h-7" />, value: courses.reduce((sum, c) => sum + (c._count?.lessons || 0), 0), label: 'درس فيديو', color: 'text-blue-400' },
                      { icon: <Users className="w-7 h-7" />, value: '500+', label: 'طالب نشط', color: 'text-green-400' },
                      { icon: <Monitor className="w-7 h-7" />, value: '24/7', label: 'متاح دائماً', color: 'text-purple-400' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center"
                      >
                        <div className={`${stat.color} mb-2 flex justify-center`}>{stat.icon}</div>
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className={`text-sm ${textSecondary}`}>{stat.label}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </section>

              {/* ===== FEATURES SECTION ===== */}
              <section className="max-w-7xl mx-auto px-4 py-20">
                <motion.div
                  className="text-center mb-14"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Badge className="mb-4 bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20 px-4 py-1">
                    <Sparkles className="w-4 h-4 ml-1" /> لماذا ويكي فيزياء؟
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    منصة مصممة خصيصاً <span className="orange-gradient-text">للطالب العربي</span>
                  </h2>
                  <p className={`${textSecondary} max-w-2xl mx-auto text-lg`}>
                    نوفر لك تجربة تعليمية متكاملة تجمع بين التكنولوجيا الحديثة وأفضل طرق التدريس
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <Atom className="w-7 h-7" />,
                      title: 'محتوى فيزيائي متخصص',
                      desc: 'شروحات مركزة على الفيزياء بجميع فروعها — ميكانيكا، كهربية، حديثة، وغيرها — مصممة حسب المناهج العربية.',
                      gradient: 'from-orange-500/10 to-red-500/10',
                    },
                    {
                      icon: <Video className="w-7 h-7" />,
                      title: 'فيديوهات تفاعلية عالية الجودة',
                      desc: 'دروس مسجلة بأعلى جودة مع رسوم توضيحية متحركة وأمثلة عملية تساعدك على الفهم العميق وليس الحفظ.',
                      gradient: 'from-blue-500/10 to-cyan-500/10',
                    },
                    {
                      icon: <ShieldCheck className="w-7 h-7" />,
                      title: 'حماية وأمان المحتوى',
                      desc: 'نظام حماية متطور يضمن وصول المحتوى فقط للمشتركين المصرح لهم مع منع مشاركة الحسابات.',
                      gradient: 'from-green-500/10 to-emerald-500/10',
                    },
                    {
                      icon: <Headphones className="w-7 h-7" />,
                      title: 'متابعة ودعم مستمر',
                      desc: 'تواصل مباشر مع المدرسين عبر الواتساب لأي استفسار أو مساعدة في حل المسائل والواجبات.',
                      gradient: 'from-purple-500/10 to-pink-500/10',
                    },
                    {
                      icon: <Smartphone className="w-7 h-7" />,
                      title: 'تعلم من أي مكان',
                      desc: 'منصة متوافقة مع جميع الأجهزة — شاهد الدروس من الموبايل أو التابلت أو الكمبيوتر في أي وقت.',
                      gradient: 'from-yellow-500/10 to-orange-500/10',
                    },
                    {
                      icon: <TrendingUp className="w-7 h-7" />,
                      title: 'تتبع تقدمك',
                      desc: 'تابع مستواك وتقدمك في كل كورس مع إحصائيات تفصيلية وتقارير دورية تساعدك تحسن أداءك.',
                      gradient: 'from-teal-500/10 to-blue-500/10',
                    },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                      <Card className={`p-6 ${bgCard} video-card-hover h-full group`}>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-[#FF7A00] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                          {feature.icon}
                        </div>
                        <h3 className="font-bold text-lg mb-3 group-hover:text-[#FF7A00] transition-colors">{feature.title}</h3>
                        <p className={`${textSecondary} text-sm leading-relaxed`}>{feature.desc}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ===== FEATURED COURSES ===== */}
              <section className={`py-20 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100/50'}`}>
                <div className="max-w-7xl mx-auto px-4">
                  <motion.div
                    className="flex items-center justify-between mb-10"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <div>
                      <Badge className="mb-3 bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20 px-3 py-1">
                        <GraduationCap className="w-3.5 h-3.5 ml-1" /> الكورسات
                      </Badge>
                      <h2 className="text-2xl md:text-3xl font-bold">الكورسات المميزة</h2>
                      <p className={`${textSecondary} mt-1`}>اختر الكورس المناسب لك وابدأ رحلة التعلم</p>
                    </div>
                    <Button variant="outline" className={`border-[#FF7A00]/30 text-[#FF7A00] hidden sm:flex`} onClick={() => setCurrentPage('courses')}>
                      عرض الكل <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.slice(0, 6).map((course, i) => (
                      <motion.div
                        key={course.id}
                        initial={{ y: 30, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className={`overflow-hidden ${bgCard} video-card-hover cursor-pointer group`}
                          onClick={() => navigateToCourse(course.id)}
                        >
                          <div className="relative h-48 bg-gradient-to-br from-[#FF7A00]/20 to-[#FF7A00]/5 flex items-center justify-center overflow-hidden">
                            {course.image ? (
                              <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <BookOpen className="w-16 h-16 text-[#FF7A00]/30" />
                            )}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-[#FF7A00] text-black font-bold">{course.price}</Badge>
                            </div>
                            {hasAccessToCourse(course.id) && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-green-500 text-white"><Unlock className="w-3 h-3 ml-1" /> مفعّل</Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-[#FF7A00] transition-colors">{course.title}</h3>
                            <p className={`text-sm ${textSecondary} line-clamp-2 mb-4`}>{course.description}</p>
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center gap-1 text-sm ${textSecondary}`}>
                                <Video className="w-4 h-4" /> {course._count?.lessons || 0} درس
                              </div>
                              <Button size="sm" variant="ghost" className="text-[#FF7A00]">
                                تفاصيل <ChevronLeft className="w-4 h-4 mr-1" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {courses.length === 0 && (
                    <motion.div
                      className="text-center py-16"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      <BookOpen className={`w-16 h-16 mx-auto mb-4 ${textMuted}`} />
                      <p className={`text-lg ${textSecondary}`}>لا توجد كورسات حالياً</p>
                      <p className={`text-sm ${textMuted}`}>سيتم إضافة كورسات جديدة قريباً</p>
                    </motion.div>
                  )}

                  {/* Mobile show all button */}
                  <div className="mt-8 text-center sm:hidden">
                    <Button variant="outline" className={`border-[#FF7A00]/30 text-[#FF7A00]`} onClick={() => setCurrentPage('courses')}>
                      عرض كل الكورسات <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </div>
              </section>

              {/* ===== HOW IT WORKS ===== */}
              <section className="max-w-7xl mx-auto px-4 py-20">
                <motion.div
                  className="text-center mb-14"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Badge className="mb-4 bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20 px-4 py-1">
                    <Target className="w-4 h-4 ml-1" /> خطوات بسيطة
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">كيف تبدأ رحلتك؟</h2>
                  <p className={`${textSecondary} max-w-2xl mx-auto text-lg`}>
                    في 4 خطوات بس هيبقى معاك وصول لكل الكورسات والدروس
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                  {/* Connecting line (desktop only) */}
                  <div className="hidden md:block absolute top-[52px] right-[12.5%] left-[12.5%] h-[2px] bg-gradient-to-l from-[#FF7A00]/40 via-[#FF7A00]/20 to-[#FF7A00]/40" />

                  {[
                    { step: '١', icon: <User className="w-8 h-8" />, title: 'سجّل حسابك', desc: 'أدخل بياناتك ورقم هاتفك والمرحلة التعليمية في ثواني' },
                    { step: '٢', icon: <BookOpen className="w-8 h-8" />, title: 'اختر الكورس', desc: 'تصفح الكورسات المتاحة واختر الكورس اللي يناسبك' },
                    { step: '٣', icon: <Key className="w-8 h-8" />, title: 'فعّل الكود', desc: 'أدخل كود الاشتراك أو أرسل طلب للأدمن مباشرة' },
                    { step: '٤', icon: <Play className="w-8 h-8" />, title: 'ابدأ التعلم', desc: 'شاهد الدروس وتعلم في أي وقت ومن أي مكان' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <Card className={`p-6 text-center ${bgCard} h-full relative`}>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF9D40] text-black flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#FF7A00]/20">
                          {item.icon}
                        </div>
                        <div className="text-sm text-[#FF7A00] font-bold mb-2">الخطوة {item.step}</div>
                        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                        <p className={`text-sm ${textSecondary}`}>{item.desc}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ===== TESTIMONIALS ===== */}
              <section className="max-w-7xl mx-auto px-4 py-20">
                <motion.div
                  className="text-center mb-14"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Badge className="mb-4 bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20 px-4 py-1">
                    <Star className="w-4 h-4 ml-1" /> آراء الطلاب
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">إيه الطلاب بتقول؟</h2>
                  <p className={`${textSecondary} max-w-2xl mx-auto text-lg`}>
                    تعليقات حقيقية من طلاب غيروا طريقتهم في تعلم الفيزياء
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      name: 'أحمد محمد',
                      stage: 'الصف الثالث الثانوي',
                      text: 'منصة ويكي فيزياء غيّرت طريقة فهمي للفيزياء تماماً. الشروحات بسيطة وواضحة وفي النهاية بفهم مش بحفظ. أفضل استثمار عملته في مستقبلي.',
                      rating: 5,
                    },
                    {
                      name: 'سارة علي',
                      stage: 'الصف الثاني الثانوي',
                      text: 'كنت بخاف من الفيزياء، بس بعد الكورسات دي بقيت أحبها. المدرس بيشرح بطريقة سهلة وبيوصل المعلومة بسرعة. شكراً ويكي فيزياء!',
                      rating: 5,
                    },
                    {
                      name: 'محمود حسن',
                      stage: 'طالب جامعي — كلية الهندسة',
                      text: 'المحتوى ممتاز ومتنظم بشكل احترافي. قدرت أراجع كل اللي فاتني وأفهم أساسيات كنت ناسيها. الدعم كمان سريع جداً ومفيد.',
                      rating: 5,
                    },
                  ].map((testimonial, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <Card className={`p-6 ${bgCard} video-card-hover h-full`}>
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, s) => (
                            <Star key={s} className="w-4 h-4 fill-[#FF7A00] text-[#FF7A00]" />
                          ))}
                        </div>
                        <p className={`${textSecondary} mb-5 leading-relaxed text-sm`}>&quot;{testimonial.text}&quot;</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF9D40] flex items-center justify-center text-black font-bold text-sm">
                            {testimonial.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{testimonial.name}</div>
                            <div className={`text-xs ${textMuted}`}>{testimonial.stage}</div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ===== CTA SECTION ===== */}
              <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/10 via-transparent to-[#FF7A00]/5" />
                <div className="absolute inset-0 grid-pattern opacity-30" />
                {/* Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF7A00]/8 rounded-full blur-[120px]" />

                <div className="max-w-4xl mx-auto px-4 text-center relative">
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF7A00] to-[#FF9D40] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#FF7A00]/20"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <GraduationCap className="w-10 h-10 text-black" />
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                      جاهز تبدأ <span className="orange-gradient-text">رحلة التعلم؟</span>
                    </h2>
                    <p className={`${textSecondary} text-lg max-w-2xl mx-auto mb-10 leading-relaxed`}>
                      انضم لأكثر من 500 طالب اختاروا يتعلموا الفيزياء بطريقة مختلفة.
                      سجّل الآن واحصل على وصول فوري للكورسات المتاحة.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {!student ? (
                        <>
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] hover:from-[#FF8A10] hover:to-[#FFAD50] text-black font-bold px-10 glow-orange text-lg h-14"
                            onClick={() => setShowRegister(true)}
                          >
                            <User className="w-5 h-5 ml-2" /> سجّل الآن مجاناً
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className={`border-[#FF7A00]/30 text-[#FF7A00] hover:bg-[#FF7A00]/10 px-10 h-14 text-lg`}
                            onClick={() => setCurrentPage('courses')}
                          >
                            <BookOpen className="w-5 h-5 ml-2" /> تصفح الكورسات
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] hover:from-[#FF8A10] hover:to-[#FFAD50] text-black font-bold px-10 glow-orange text-lg h-14"
                          onClick={() => setCurrentPage('courses')}
                        >
                          <BookOpen className="w-5 h-5 ml-2" /> تصفح الكورسات
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* ===== FOOTER ===== */}
              <footer className={`py-12 border-t ${darkMode ? 'bg-[#050505] border-[#FF7A00]/10' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF9D40] flex items-center justify-center text-black font-bold">
                          و
                        </div>
                        <span className="text-xl font-bold">ويكي فيزياء</span>
                      </div>
                      <p className={`${textSecondary} text-sm leading-relaxed`}>
                        منصة تعليمية متخصصة في الفيزياء للطالب العربي. نساعدك تفهم الفيزياء بطريقة مختلفة ومتطورة.
                      </p>
                    </div>
                    {/* Links */}
                    <div>
                      <h4 className="font-bold mb-4">روابط سريعة</h4>
                      <div className="space-y-2">
                        <button onClick={() => setCurrentPage('home')} className={`block text-sm ${textSecondary} hover:text-[#FF7A00] transition-colors`}>الرئيسية</button>
                        <button onClick={() => setCurrentPage('courses')} className={`block text-sm ${textSecondary} hover:text-[#FF7A00] transition-colors`}>الكورسات</button>
                        <button onClick={() => !student ? setShowRegister(true) : null} className={`block text-sm ${textSecondary} hover:text-[#FF7A00] transition-colors`}>التسجيل</button>
                      </div>
                    </div>
                    {/* Contact */}
                    <div>
                      <h4 className="font-bold mb-4">تواصل معنا</h4>
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                          <Phone className="w-4 h-4 text-[#FF7A00]" /> واتساب للدعم والمساعدة
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                          <MessageSquare className="w-4 h-4 text-[#FF7A00]" /> رد سريع على الاستفسارات
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                          <Wifi className="w-4 h-4 text-[#FF7A00]" /> متاح 24/7
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`pt-6 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'} text-center`}>
                    <p className={`text-sm ${textMuted}`}>
                      © {new Date().getFullYear()} ويكي فيزياء — جميع الحقوق محفوظة
                    </p>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* ===== COURSES PAGE ===== */}
          {currentPage === 'courses' && (
            <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold">جميع الكورسات</h1>
                  <p className={`${textSecondary} mt-1`}>{courses.length} كورس متاح</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                  <Input
                    placeholder="ابحث عن كورس..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputBg} pr-10`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter(c => c.title.includes(searchQuery) || c.description.includes(searchQuery))
                  .map((course) => (
                    <Card key={course.id} className={`overflow-hidden ${bgCard} video-card-hover cursor-pointer group`}
                      onClick={() => navigateToCourse(course.id)}
                    >
                      <div className="relative h-44 bg-gradient-to-br from-[#FF7A00]/20 to-[#FF7A00]/5 flex items-center justify-center overflow-hidden">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <BookOpen className="w-14 h-14 text-[#FF7A00]/30" />
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-[#FF7A00] text-black font-bold">{course.price}</Badge>
                        </div>
                        {hasAccessToCourse(course.id) && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500 text-white"><Unlock className="w-3 h-3 ml-1" /> مفعّل</Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-[#FF7A00] transition-colors">{course.title}</h3>
                        <p className={`text-sm ${textSecondary} line-clamp-2 mb-4`}>{course.description}</p>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-1 text-sm ${textSecondary}`}>
                            <Video className="w-4 h-4" /> {course._count?.lessons || 0} درس
                          </div>
                          <Button size="sm" className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black">
                            {hasAccessToCourse(course.id) ? 'ادخل الكورس' : 'تفاصيل'} <ChevronLeft className="w-4 h-4 mr-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>

              {courses.filter(c => c.title.includes(searchQuery) || c.description.includes(searchQuery)).length === 0 && (
                <div className="text-center py-16">
                  <Search className={`w-16 h-16 mx-auto mb-4 ${textMuted}`} />
                  <p className={`text-lg ${textSecondary}`}>لا توجد نتائج</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== COURSE DETAIL PAGE ===== */}
          {currentPage === 'course-detail' && selectedCourse && (
            <motion.div key={`course-${selectedCourse.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={`border-b ${borderColor}`}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage('courses')} className={textSecondary}>
                    <ChevronRight className="w-4 h-4 ml-1" /> الكورسات
                  </Button>
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Course Info */}
                  <div className="lg:col-span-2">
                    <div className="relative h-56 md:h-72 rounded-2xl bg-gradient-to-br from-[#FF7A00]/20 to-[#FF7A00]/5 flex items-center justify-center overflow-hidden mb-6">
                      {selectedCourse.image ? (
                        <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-20 h-20 text-[#FF7A00]/30" />
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-3">{selectedCourse.title}</h1>
                    <p className={`${textSecondary} text-lg mb-6`}>{selectedCourse.description}</p>

                    {/* Lessons List */}
                    <div className="space-y-3">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#FF7A00]" /> الدروس ({selectedCourse.lessons?.length || 0})
                      </h2>
                      {selectedCourse.lessons?.sort((a, b) => a.order - b.order).map((lesson, i) => {
                        const canAccess = hasAccessToCourse(selectedCourse.id);
                        return (
                          <Card key={lesson.id} className={`p-4 ${bgCard} ${canAccess ? 'cursor-pointer hover:border-[#FF7A00]/40 transition-colors' : 'opacity-70'} group`}
                            onClick={() => canAccess ? navigateToLesson(lesson.id) : undefined}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${canAccess ? 'bg-[#FF7A00]/10 text-[#FF7A00]' : `${bgSecondary} ${textMuted}`}`}>
                                {canAccess ? <Play className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${textMuted}`}>{i + 1}.</span>
                                  <h3 className="font-medium group-hover:text-[#FF7A00] transition-colors truncate">{lesson.title}</h3>
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${textMuted} mt-1`}>
                                  {lesson.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration}</span>}
                                  <span>{lesson.videoType === 'youtube' ? 'يوتيوب' : lesson.videoType === 'upload' ? 'مرفوع' : 'رابط خارجي'}</span>
                                </div>
                              </div>
                              {!canAccess && (
                                <Lock className={`w-4 h-4 ${textMuted}`} />
                              )}
                            </div>
                          </Card>
                        );
                      })}
                      {(!selectedCourse.lessons || selectedCourse.lessons.length === 0) && (
                        <div className="text-center py-12">
                          <Video className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
                          <p className={textSecondary}>لا توجد دروس بعد</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <Card className={`p-6 ${bgCard} sticky top-24`}>
                      <div className="text-center mb-6">
                        <Badge className="bg-[#FF7A00] text-black text-lg px-4 py-1 font-bold">{selectedCourse.price}</Badge>
                      </div>
                      {hasAccessToCourse(selectedCourse.id) ? (
                        <div className="space-y-4">
                          <div className={`p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center`}>
                            <p className="text-green-500 font-medium flex items-center justify-center gap-2">
                              <Unlock className="w-4 h-4" /> أنت مشترك في هذا الكورس
                            </p>
                          </div>
                          {activeCourses.filter(ac => ac.courseId === selectedCourse.id).map(ac => (
                            <p key={ac.courseId} className={`text-xs text-center ${textMuted}`}>
                              ينتهي الاشتراك في {new Date(ac.expiresAt).toLocaleDateString('ar-EG')}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {student ? (
                            <>
                              <div className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${textSecondary} mb-2`}>لديك كود اشتراك؟</p>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className={inputBg}
                                    dir="ltr"
                                  />
                                  <Button className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black shrink-0" onClick={handleActivateKey} disabled={loading || !accessCode.trim()}>
                                    تفعيل
                                  </Button>
                                </div>
                              </div>
                              <Button className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] text-black font-bold" onClick={() => {
                                setRequestForm({...requestForm, courseId: selectedCourse.id});
                                setShowAccessRequest(true);
                              }}>
                                <Send className="w-4 h-4 ml-2" /> طلب اشتراك
                              </Button>
                            </>
                          ) : (
                            <Button className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] text-black font-bold" onClick={() => setShowRegister(true)}>
                              <User className="w-4 h-4 ml-2" /> سجّل للاشتراك
                            </Button>
                          )}
                        </div>
                      )}
                      <Separator className={`my-4 ${borderColor}`} />
                      <div className={`text-sm ${textSecondary} space-y-2`}>
                        <p className="flex items-center gap-2"><Video className="w-4 h-4" /> {selectedCourse._count?.lessons || 0} درس</p>
                        <p className="flex items-center gap-2"><Monitor className="w-4 h-4" /> مشاهدة من أي جهاز</p>
                        <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> متاح 24/7</p>
                        <p className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> دعم متعدد الأجهزة</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== LESSON PAGE ===== */}
          {currentPage === 'lesson' && selectedLesson && selectedCourse && (
            <motion.div key={`lesson-${selectedLesson.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={`border-b ${borderColor}`}>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage('courses')} className={textSecondary}>
                    <ChevronRight className="w-4 h-4 ml-1" /> الكورسات
                  </Button>
                  <ChevronLeft className={`w-4 h-4 ${textMuted}`} />
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage('course-detail')} className={textSecondary}>
                    {selectedCourse.title}
                  </Button>
                </div>
              </div>

              <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8">
                  {selectedLesson.videoType === 'youtube' && getYouTubeId(selectedLesson.videoUrl || '') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(selectedLesson.videoUrl || '')}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : selectedLesson.videoType === 'upload' && selectedLesson.filePath ? (
                    <video
                      src={selectedLesson.filePath}
                      className="w-full h-full"
                      controls
                      controlsList="nodownload"
                    />
                  ) : selectedLesson.videoType === 'external' && selectedLesson.videoUrl ? (
                    <iframe
                      src={selectedLesson.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <Video className="w-16 h-16" />
                    </div>
                  )}
                </div>

                {/* Lesson Info */}
                <div className="space-y-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{selectedLesson.title}</h1>
                  {selectedLesson.description && (
                    <p className={`${textSecondary} text-lg`}>{selectedLesson.description}</p>
                  )}
                  <div className={`flex items-center gap-4 text-sm ${textMuted}`}>
                    {selectedLesson.duration && (
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedLesson.duration}</span>
                    )}
                    <span className="flex items-center gap-1">
                      {selectedLesson.videoType === 'youtube' ? 'يوتيوب' :
                        selectedLesson.videoType === 'upload' ? 'فيديو مرفوع' : 'رابط خارجي'}
                    </span>
                  </div>
                </div>

                {/* Lesson Navigation */}
                {selectedCourse?.lessons && (
                  <div className="mt-8">
                    <Separator className={borderColor} />
                    <h3 className="font-bold mt-6 mb-4">الدروس التالية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCourse.lessons
                        .filter(l => l.id !== selectedLesson.id)
                        .slice(0, 4)
                        .map(lesson => (
                          <Card key={lesson.id} className={`p-3 ${bgCard} cursor-pointer hover:border-[#FF7A00]/40 transition-colors`}
                            onClick={() => navigateToLesson(lesson.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center shrink-0">
                                <Play className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{lesson.title}</p>
                                {lesson.duration && <p className={`text-xs ${textMuted}`}>{lesson.duration}</p>}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== PROFILE PAGE ===== */}
          {currentPage === 'profile' && student && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-4 py-8">
              <Card className={`p-8 ${bgCard}`}>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF9D40] flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                  <p className={textSecondary}>{student.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <Card className={`p-4 ${bgSecondary}`}>
                    <p className={`text-sm ${textMuted}`}>المرحلة</p>
                    <p className="font-bold">{student.stage || '—'}</p>
                  </Card>
                  <Card className={`p-4 ${bgSecondary}`}>
                    <p className={`text-sm ${textMuted}`}>السنة</p>
                    <p className="font-bold">{student.year || '—'}</p>
                  </Card>
                  <Card className={`p-4 ${bgSecondary}`}>
                    <p className={`text-sm ${textMuted}`}>واتساب</p>
                    <p className="font-bold" dir="ltr">{student.whatsapp || '—'}</p>
                  </Card>
                  <Card className={`p-4 ${bgSecondary}`}>
                    <p className={`text-sm ${textMuted}`}>تاريخ التسجيل</p>
                    <p className="font-bold">{new Date(student.createdAt).toLocaleDateString('ar-EG')}</p>
                  </Card>
                </div>

                {/* Active Courses */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#FF7A00]" /> كورساتي المشترك بها ({activeCourses.length})
                  </h2>
                  {activeCourses.length > 0 ? (
                    <div className="space-y-3">
                      {activeCourses.map((ac, i) => (
                        <Card key={i} className={`p-4 ${bgSecondary}`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{ac.courseTitle || 'كورس'}</p>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500/20 text-green-500 text-xs">نشط</Badge>
                              <span className={`text-xs ${textMuted}`}>ينتهي {new Date(ac.expiresAt).toLocaleDateString('ar-EG')}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${bgSecondary} rounded-xl`}>
                      <BookOpen className={`w-10 h-10 mx-auto mb-2 ${textMuted}`} />
                      <p className={textSecondary}>لا توجد كورسات مشترك بها</p>
                      <Button className="mt-3 bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={() => setCurrentPage('courses')}>
                        تصفح الكورسات
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className={`my-6 ${borderColor}`} />

                {/* Activate Key */}
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#FF7A00]" /> تفعيل كود
                  </h2>
                  <div className="flex gap-2">
                    <Input
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className={inputBg}
                      dir="ltr"
                    />
                    <Button className="bg-[#FF7A00] hover:bg-[#FF8A10] text-black shrink-0" onClick={handleActivateKey} disabled={loading || !accessCode.trim()}>
                      {loading ? 'جاري...' : 'تفعيل'}
                    </Button>
                  </div>
                </div>

                <Separator className={`my-6 ${borderColor}`} />

                <Button variant="outline" className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={handleStudentLogout}>
                  <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج
                </Button>
              </Card>
            </motion.div>
          )}

          {/* ===== ADMIN PAGE ===== */}
          {currentPage === 'admin' && admin && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex h-[calc(100vh-4rem)]">
                {/* Desktop Sidebar */}
                <aside className={`hidden md:flex flex-col w-64 shrink-0 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100'} border-l ${borderColor} p-4`}>
                  <div className="mb-6">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#FF7A00]" /> لوحة التحكم
                    </h2>
                    <p className={`text-xs ${textMuted} mt-1`}>مرحباً، {admin.username}</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    {adminTabs.map(tab => (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        className={`w-full justify-start ${adminTab === tab.id ? 'bg-[#FF7A00]/10 text-[#FF7A00]' : ''}`}
                        onClick={() => setAdminTab(tab.id)}
                      >
                        {tab.icon} <span className="mr-2">{tab.label}</span>
                        {tab.id === 'requests' && unreadCount > 0 && (
                          <Badge className="mr-auto bg-red-500 text-white text-xs">{unreadCount}</Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                  <Separator className={`my-4 ${borderColor}`} />
                  <Button variant="ghost" className="w-full justify-start text-red-500" onClick={handleAdminLogout}>
                    <LogOut className="w-4 h-4" /> <span className="mr-2">تسجيل الخروج</span>
                  </Button>
                </aside>

                {/* Mobile Admin Layout */}
                <div className="md:hidden flex flex-col w-full h-[calc(100vh-4rem)]">
                  {/* Mobile admin header */}
                  <div className={`${darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100'} border-b ${borderColor} px-4 py-3 flex items-center justify-between`}>
                    <h2 className="font-bold flex items-center gap-2">
                      {adminTabs.filter(t => t.id === adminTab)[0]?.icon}
                      <span>{adminTabs.filter(t => t.id === adminTab)[0]?.label}</span>
                      {adminTab === 'requests' && unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
                      )}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-red-500 w-8 h-8" onClick={handleAdminLogout}>
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile admin content - scrollable with bottom padding for nav bar */}
                  <div className="flex-1 overflow-y-auto p-4 pb-20">
                    {renderAdminContent()}
                  </div>

                  {/* Mobile Bottom Navigation Bar */}
                  <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? 'bg-[#0a0a0a]/95' : 'bg-white/95'} backdrop-blur-xl border-t ${borderColor}`}>
                    <div className="grid grid-cols-7 h-16">
                      {adminTabs.map(tab => (
                        <button
                          key={tab.id}
                          className={`flex flex-col items-center justify-center gap-0.5 relative ${adminTab === tab.id ? 'text-[#FF7A00]' : textMuted} active:scale-95 transition-transform`}
                          onClick={() => setAdminTab(tab.id)}
                        >
                          {tab.icon}
                          <span className="text-[10px] leading-tight">{tab.label}</span>
                          {tab.id === 'requests' && unreadCount > 0 && (
                            <span className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}
                          {adminTab === tab.id && (
                            <span className="absolute bottom-0 w-8 h-0.5 bg-[#FF7A00] rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Safe area bottom for iPhone notch */}
                    <div className="safe-area-bottom" />
                  </div>
                </div>

                {/* Desktop Admin Content */}
                <div className="hidden md:block flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
                  {renderAdminContent()}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== NOT FOUND / FALLBACK ===== */}
          {!['home', 'courses', 'course-detail', 'lesson', 'admin', 'profile'].includes(currentPage) && (
            <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-20 text-center">
              <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${textMuted}`} />
              <h2 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h2>
              <p className={textSecondary}>الصفحة المطلوبة غير متاحة</p>
              <Button className="mt-4 bg-[#FF7A00] hover:bg-[#FF8A10] text-black" onClick={() => setCurrentPage('home')}>
                <Home className="w-4 h-4 ml-2" /> الرجوع للرئيسية
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Developer Signature - shown on all pages */}
        <DevSignature />
      </main>

      {/* ========== DIALOGS ========== */}

      {/* Student Registration Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center">تسجيل طالب جديد</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">نموذج تسجيل طالب جديد في المنصة</DialogDescription>
          <div className="space-y-4 mt-4">
            <div>
              <Label>الاسم الكامل</Label>
              <Input value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className={inputBg} placeholder="أدخل اسمك" />
            </div>
            <div>
              <Label>اسم المستخدم</Label>
              <Input value={studentForm.username} onChange={(e) => setStudentForm({...studentForm, username: e.target.value})} className={inputBg} dir="ltr" placeholder="مثال: ahmed2024" />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input value={studentForm.password} onChange={(e) => setStudentForm({...studentForm, password: e.target.value})} className={inputBg} dir="ltr" type="password" placeholder="أدخل كلمة المرور" />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value={studentForm.phone} onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})} className={inputBg} dir="ltr" placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <Label>رقم واتساب</Label>
              <Input value={studentForm.whatsapp} onChange={(e) => setStudentForm({...studentForm, whatsapp: e.target.value})} className={inputBg} dir="ltr" placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <Label>المرحلة الدراسية</Label>
              <Select value={studentForm.stage} onValueChange={(v) => setStudentForm({...studentForm, stage: v})}>
                <SelectTrigger className={inputBg}><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="أولى">أولى ثانوي</SelectItem>
                  <SelectItem value="ثانية">ثانية ثانوي</SelectItem>
                  <SelectItem value="ثالثة">ثالثة ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] hover:from-[#FF8A10] hover:to-[#FFAD50] text-black font-bold"
              onClick={handleStudentRegister}
              disabled={loading || !studentForm.name || !studentForm.username || !studentForm.password || !studentForm.phone || !studentForm.stage}
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </Button>
            <div className="text-center">
              <button className={`text-sm ${textSecondary} hover:text-[#FF7A00]`} onClick={() => { setShowRegister(false); setShowStudentLogin(true); }}>
                عندك حساب؟ سجّل دخول
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Login Dialog */}
      <Dialog open={showStudentLogin} onOpenChange={setShowStudentLogin}>
        <DialogContent className={`sm:max-w-sm ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center">تسجيل دخول الطالب</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">نموذج تسجيل دخول الطالب</DialogDescription>
          <div className="space-y-4 mt-4">
            <div>
              <Label>اسم المستخدم</Label>
              <Input value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className={inputBg} dir="ltr" placeholder="أدخل اسم المستخدم" />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className={inputBg} dir="ltr" type="password" placeholder="أدخل كلمة المرور" />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] hover:from-[#FF8A10] hover:to-[#FFAD50] text-black font-bold"
              onClick={handleStudentLogin}
              disabled={loading || !loginForm.username || !loginForm.password}
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
            <div className="text-center">
              <button className={`text-sm ${textSecondary} hover:text-[#FF7A00]`} onClick={() => { setShowStudentLogin(false); setShowRegister(true); }}>
                مش عندك حساب؟ سجّل الآن
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className={`sm:max-w-sm ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center">دخول لوحة الأدمن</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">نموذج تسجيل دخول الأدمن</DialogDescription>
          <div className="space-y-4 mt-4">
            <div>
              <Label>اسم المستخدم</Label>
              <Input
                value={adminForm.username}
                onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                className={inputBg}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                className={inputBg}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </div>
            <Button
              className="w-full bg-[#FF7A00] hover:bg-[#FF8A10] text-black font-bold"
              onClick={handleAdminLogin}
              disabled={loading || !adminForm.username || !adminForm.password}
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>

            <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
              <p className={`text-xs ${textSecondary}`}>
                💡 بيانات الدخول الافتراضية: <strong>admin</strong> / <strong>admin123</strong>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Request Dialog */}
      <Dialog open={showAccessRequest} onOpenChange={setShowAccessRequest}>
        <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-[#111] border-[rgba(255,122,0,0.2)] text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center">طلب اشتراك</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">نموذج طلب اشتراك في كورس</DialogDescription>
          <div className="space-y-4 mt-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'} border border-yellow-500/20`}>
              <p className="text-sm text-yellow-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> أدخل بياناتك وسيتم إرسال الطلب للأدمن
              </p>
            </div>
            <div>
              <Label>رقم واتساب التواصل</Label>
              <Input
                value={requestForm.whatsapp}
                onChange={(e) => setRequestForm({...requestForm, whatsapp: e.target.value})}
                className={inputBg}
                dir="ltr"
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div>
              <Label>كود الاشتراك (لو عندك)</Label>
              <Input
                value={requestForm.code}
                onChange={(e) => setRequestForm({...requestForm, code: e.target.value})}
                className={inputBg}
                dir="ltr"
                placeholder="XXXX-XXXX-XXXX-XXXX"
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={requestForm.message}
                onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                className={inputBg}
                placeholder="أي ملاحظات أو استفسارات..."
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9D40] hover:from-[#FF8A10] hover:to-[#FFAD50] text-black font-bold"
              onClick={handleSendRequest}
              disabled={loading || !requestForm.whatsapp}
            >
              <Send className="w-4 h-4 ml-2" /> {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
