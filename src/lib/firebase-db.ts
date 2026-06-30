import { database } from './firebase';
import { ref, set, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database';

// ========== HELPER ==========
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateKeyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

// ========== ADMIN ==========
export async function getAdmin(username: string, password: string) {
  const snapshot = await get(ref(database, 'admins'));
  if (!snapshot.exists()) return null;
  
  const admins = snapshot.val();
  for (const [id, admin] of Object.entries(admins as Record<string, any>)) {
    if (admin.username === username && admin.password === password) {
      return { id, ...admin };
    }
  }
  return null;
}

export async function getAdminById(id: string) {
  const snapshot = await get(ref(database, `admins/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() };
}

export async function createAdmin(username: string, password: string) {
  // Check if any admin exists
  const snapshot = await get(ref(database, 'admins'));
  if (snapshot.exists() && Object.keys(snapshot.val()).length > 0) {
    return { error: 'يوجد حساب أدمن بالفعل' };
  }
  
  const id = generateId();
  await set(ref(database, `admins/${id}`), {
    username,
    password,
    createdAt: new Date().toISOString()
  });
  return { id, username, password };
}

export async function adminExists(): Promise<boolean> {
  const snapshot = await get(ref(database, 'admins'));
  return snapshot.exists() && Object.keys(snapshot.val()).length > 0;
}

// ========== COURSES ==========
export async function getCourses() {
  const snapshot = await get(ref(database, 'courses'));
  if (!snapshot.exists()) return [];
  
  const courses = [];
  const data = snapshot.val();
  for (const [id, course] of Object.entries(data as Record<string, any>)) {
    const lessons = await getCourseLessons(id);
    courses.push({ 
      id, 
      ...course, 
      lessons,
      _count: { lessons: lessons.length }
    });
  }
  return courses.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

export async function getCourse(id: string) {
  const snapshot = await get(ref(database, `courses/${id}`));
  if (!snapshot.exists()) return null;
  
  const lessons = await getCourseLessons(id);
  return { id, ...snapshot.val(), lessons, _count: { lessons: lessons.length } };
}

export async function createCourse(data: { title: string; description: string; image?: string; price: string; order?: number }) {
  const id = generateId();
  await set(ref(database, `courses/${id}`), {
    title: data.title,
    description: data.description || '',
    image: data.image || null,
    price: data.price || 'مجاني',
    order: data.order || 0,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { id, ...data };
}

export async function updateCourse(id: string, data: any) {
  await update(ref(database, `courses/${id}`), {
    ...data,
    updatedAt: new Date().toISOString()
  });
  return { id, ...data };
}

export async function deleteCourse(id: string) {
  // Delete lessons too
  const lessonsSnapshot = await get(ref(database, 'lessons'));
  if (lessonsSnapshot.exists()) {
    const lessons = lessonsSnapshot.val();
    for (const [lessonId, lesson] of Object.entries(lessons as Record<string, any>)) {
      if (lesson.courseId === id) {
        await remove(ref(database, `lessons/${lessonId}`));
      }
    }
  }
  await remove(ref(database, `courses/${id}`));
  return { success: true };
}

// ========== LESSONS ==========
export async function getCourseLessons(courseId: string) {
  const snapshot = await get(ref(database, 'lessons'));
  if (!snapshot.exists()) return [];
  
  const lessons = [];
  const data = snapshot.val();
  for (const [id, lesson] of Object.entries(data as Record<string, any>)) {
    if (lesson.courseId === courseId) {
      lessons.push({ id, ...lesson });
    }
  }
  return lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

export async function getAllLessons() {
  const snapshot = await get(ref(database, 'lessons'));
  if (!snapshot.exists()) return [];
  
  const lessons = [];
  const data = snapshot.val();
  for (const [id, lesson] of Object.entries(data as Record<string, any>)) {
    lessons.push({ id, ...lesson });
  }
  return lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

export async function getLesson(id: string) {
  const snapshot = await get(ref(database, `lessons/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() };
}

export async function createLesson(data: { title: string; description?: string; videoType: string; videoUrl?: string; filePath?: string; courseId: string; order?: number; duration?: string }) {
  const id = generateId();
  await set(ref(database, `lessons/${id}`), {
    title: data.title,
    description: data.description || null,
    videoType: data.videoType || 'youtube',
    videoUrl: data.videoUrl || null,
    filePath: data.filePath || null,
    courseId: data.courseId,
    order: data.order || 0,
    duration: data.duration || null,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { id, ...data };
}

export async function updateLesson(id: string, data: any) {
  await update(ref(database, `lessons/${id}`), {
    ...data,
    updatedAt: new Date().toISOString()
  });
  return { id, ...data };
}

export async function deleteLesson(id: string) {
  await remove(ref(database, `lessons/${id}`));
  return { success: true };
}

// ========== STUDENTS ==========
export async function getStudents() {
  const snapshot = await get(ref(database, 'students'));
  if (!snapshot.exists()) return [];
  
  const students = [];
  const data = snapshot.val();
  for (const [id, student] of Object.entries(data as Record<string, any>)) {
    students.push({ id, ...student });
  }
  return students;
}

export async function getStudent(id: string) {
  const snapshot = await get(ref(database, `students/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() };
}

export async function findStudentByPhone(phone: string) {
  const snapshot = await get(ref(database, 'students'));
  if (!snapshot.exists()) return null;
  
  const data = snapshot.val();
  for (const [id, student] of Object.entries(data as Record<string, any>)) {
    if (student.phone === phone) {
      return { id, ...student };
    }
  }
  return null;
}

export async function createStudent(data: { name: string; phone: string; whatsapp: string; stage: string; year: string; fingerprint?: string }) {
  const id = generateId();
  await set(ref(database, `students/${id}`), {
    name: data.name,
    phone: data.phone,
    whatsapp: data.whatsapp || data.phone,
    stage: data.stage || '',
    year: data.year || '',
    fingerprint: data.fingerprint || null,
    createdAt: new Date().toISOString()
  });
  return { id, ...data };
}

export async function updateStudent(id: string, data: any) {
  await update(ref(database, `students/${id}`), data);
  return { id, ...data };
}

// ========== SESSIONS ==========
export async function createSession(data: { studentId: string; token: string; fingerprint: string; deviceInfo: string; expiresAt: string }) {
  const id = generateId();
  await set(ref(database, `sessions/${id}`), {
    studentId: data.studentId,
    token: data.token,
    fingerprint: data.fingerprint,
    deviceInfo: data.deviceInfo,
    createdAt: new Date().toISOString(),
    expiresAt: data.expiresAt
  });
  return { id, ...data };
}

export async function getSession(token: string) {
  const snapshot = await get(ref(database, 'sessions'));
  if (!snapshot.exists()) return null;
  
  const data = snapshot.val();
  for (const [id, session] of Object.entries(data as Record<string, any>)) {
    if (session.token === token) {
      return { id, ...session };
    }
  }
  return null;
}

export async function deleteSession(token: string) {
  const snapshot = await get(ref(database, 'sessions'));
  if (!snapshot.exists()) return;
  
  const data = snapshot.val();
  for (const [id, session] of Object.entries(data as Record<string, any>)) {
    if (session.token === token) {
      await remove(ref(database, `sessions/${id}`));
      return;
    }
  }
}

// ========== ACCESS KEYS ==========
export async function getKeys() {
  const snapshot = await get(ref(database, 'accessKeys'));
  if (!snapshot.exists()) return [];
  
  const keys = [];
  const data = snapshot.val();
  for (const [id, key] of Object.entries(data as Record<string, any>)) {
    const course = await getCourse(key.courseId);
    const activations = await getKeyActivations(id);
    keys.push({ id, ...key, course: course ? { title: course.title } : null, activations });
  }
  return keys;
}

export async function getKeyByCode(code: string) {
  const snapshot = await get(ref(database, 'accessKeys'));
  if (!snapshot.exists()) return null;
  
  const data = snapshot.val();
  for (const [id, key] of Object.entries(data as Record<string, any>)) {
    if (key.code === code) {
      return { id, ...key };
    }
  }
  return null;
}

export async function createKey(data: { code: string; courseId: string; maxDevices: number; durationDays: number }) {
  // Check unique code
  const existing = await getKeyByCode(data.code);
  if (existing) return { error: 'هذا الكود موجود بالفعل' };
  
  const id = generateId();
  await set(ref(database, `accessKeys/${id}`), {
    code: data.code,
    courseId: data.courseId,
    maxDevices: data.maxDevices || 1,
    durationDays: data.durationDays || 30,
    active: true,
    createdAt: new Date().toISOString()
  });
  
  const course = await getCourse(data.courseId);
  return { id, ...data, course: course ? { title: course.title } : null };
}

export async function updateKey(id: string, data: any) {
  await update(ref(database, `accessKeys/${id}`), data);
  return { id, ...data };
}

// ========== KEY ACTIVATIONS ==========
export async function getKeyActivations(keyId: string) {
  const snapshot = await get(ref(database, 'keyActivations'));
  if (!snapshot.exists()) return [];
  
  const activations = [];
  const data = snapshot.val();
  for (const [id, activation] of Object.entries(data as Record<string, any>)) {
    if (activation.keyId === keyId) {
      const student = await getStudent(activation.studentId);
      activations.push({ id, ...activation, student: student ? { name: student.name, phone: student.phone } : null });
    }
  }
  return activations;
}

export async function createActivation(data: { keyId: string; studentId: string; fingerprint: string; expiresAt: string }) {
  const id = generateId();
  await set(ref(database, `keyActivations/${id}`), {
    keyId: data.keyId,
    studentId: data.studentId,
    fingerprint: data.fingerprint,
    activatedAt: new Date().toISOString(),
    expiresAt: data.expiresAt
  });
  return { id, ...data };
}

export async function getStudentActivations(studentId: string) {
  const snapshot = await get(ref(database, 'keyActivations'));
  if (!snapshot.exists()) return [];
  
  const activations = [];
  const data = snapshot.val();
  for (const [id, activation] of Object.entries(data as Record<string, any>)) {
    if (activation.studentId === studentId) {
      const key = await get(ref(database, `accessKeys/${activation.keyId}`));
      const keyData = key.exists() ? key.val() : null;
      let course = null;
      if (keyData) {
        const courseSnapshot = await get(ref(database, `courses/${keyData.courseId}`));
        course = courseSnapshot.exists() ? { title: courseSnapshot.val().title } : null;
      }
      activations.push({ 
        id, 
        ...activation, 
        accessKey: keyData ? { courseId: keyData.courseId, course } : null 
      });
    }
  }
  return activations;
}

// ========== ACCESS REQUESTS ==========
export async function getRequests() {
  const snapshot = await get(ref(database, 'accessRequests'));
  if (!snapshot.exists()) return [];
  
  const requests = [];
  const data = snapshot.val();
  for (const [id, req] of Object.entries(data as Record<string, any>)) {
    const student = await getStudent(req.studentId);
    const course = await getCourse(req.courseId);
    requests.push({ id, ...req, student, course: course ? { title: course.title } : null });
  }
  return requests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createRequest(data: { studentId: string; courseId: string; code?: string; whatsapp: string; message?: string }) {
  const id = generateId();
  await set(ref(database, `accessRequests/${id}`), {
    studentId: data.studentId,
    courseId: data.courseId,
    code: data.code || null,
    whatsapp: data.whatsapp,
    message: data.message || null,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  
  const student = await getStudent(data.studentId);
  const course = await getCourse(data.courseId);
  return { id, ...data, student, course: course ? { title: course.title } : null };
}

export async function updateRequest(id: string, data: any) {
  await update(ref(database, `accessRequests/${id}`), data);
  return { id, ...data };
}

export async function deleteRequest(id: string) {
  await remove(ref(database, `accessRequests/${id}`));
  return { success: true };
}

// ========== SETTINGS ==========
export async function getSettings() {
  const snapshot = await get(ref(database, 'settings'));
  if (!snapshot.exists()) return {};
  return snapshot.val();
}

export async function saveSettings(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    await set(ref(database, `settings/${key}`), { value });
  }
  return { success: true };
}

// ========== VIDEO UPLOADS ==========
export async function createVideoUpload(data: { fileName: string; filePath: string; fileSize: number; mimeType: string }) {
  const id = generateId();
  await set(ref(database, `videoUploads/${id}`), {
    fileName: data.fileName,
    filePath: data.filePath,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    createdAt: new Date().toISOString()
  });
  return { id, ...data };
}

// ========== DASHBOARD STATS ==========
export async function getDashboardStats() {
  const [coursesSnap, studentsSnap, keysSnap, requestsSnap, lessonsSnap, activationsSnap] = await Promise.all([
    get(ref(database, 'courses')),
    get(ref(database, 'students')),
    get(ref(database, 'accessKeys')),
    get(ref(database, 'accessRequests')),
    get(ref(database, 'lessons')),
    get(ref(database, 'keyActivations'))
  ]);

  const courseCount = coursesSnap.exists() ? Object.keys(coursesSnap.val()).length : 0;
  const studentCount = studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0;
  const keyCount = keysSnap.exists() ? Object.keys(keysSnap.val()).length : 0;
  const lessonCount = lessonsSnap.exists() ? Object.keys(lessonsSnap.val()).length : 0;
  
  let requestCount = 0;
  if (requestsSnap.exists()) {
    const reqs = requestsSnap.val();
    for (const req of Object.values(reqs as Record<string, any>)) {
      if (req.status === 'pending') requestCount++;
    }
  }

  let activeKeyCount = 0;
  if (activationsSnap.exists()) {
    const acts = activationsSnap.val();
    for (const act of Object.values(acts as Record<string, any>)) {
      if (new Date(act.expiresAt) > new Date()) activeKeyCount++;
    }
  }

  return {
    stats: { courses: courseCount, students: studentCount, keys: keyCount, requests: requestCount, lessons: lessonCount, activeKeys: activeKeyCount },
    recentRequests: await getRequests(),
    recentStudents: (await getStudents()).slice(-10).reverse()
  };
}
