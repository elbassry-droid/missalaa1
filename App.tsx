
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard, 
  Wallet, 
  Sparkles, 
  Menu, 
  X,
  Plus,
  Receipt as ReceiptIcon,
  AlertCircle,
  Printer,
  Camera,
  CheckCircle2,
  Trash2,
  UserCheck,
  Calendar,
  DollarSign,
  ArrowRight,
  QrCode,
  ArrowDownCircle,
  ArrowUpCircle,
  MessageSquare,
  FolderPlus,
  MinusCircle,
  Lock,
  LogOut,
  ShieldCheck,
  UserPlus,
  History
} from 'lucide-react';
import { Student, ClassGroup, Transaction, ViewState, User } from './types';
import { getAIInsights } from './services/geminiService';

const INITIAL_GROUPS: ClassGroup[] = [];
const INITIAL_STUDENTS: Student[] = [];

// المديرة العامة الافتراضية
const ADMIN_USER: User = {
  id: 'admin-001',
  username: 'msalaa',
  password: '2007',
  role: 'admin',
  name: 'مس آلاء نجيب'
};

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const DAYS_AR = [
  "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
];

const GRADES_LIST = [
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
];

const EXPENSE_CATEGORIES = [
  "إيجار السنتر", "كهرباء ومياه", "رواتب مساعدين", "أدوات مكتبية", "ملازم وتصوير", "دعاية وإعلان", "أخرى"
];

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('alaa_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('alaa_users');
    return saved ? JSON.parse(saved) : [ADMIN_USER];
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('alaa_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  const [groups, setGroups] = useState<ClassGroup[]>(() => {
    const saved = localStorage.getItem('alaa_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('alaa_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Persistence
  useEffect(() => { localStorage.setItem('alaa_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('alaa_groups', JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem('alaa_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('alaa_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('alaa_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('alaa_current_user');
  }, [currentUser]);

  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [viewingGroupAttendance, setViewingGroupAttendance] = useState<ClassGroup | null>(null);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth());
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());

  const [studentForPayments, setStudentForPayments] = useState<Student | null>(null);
  const [studentForID, setStudentForID] = useState<Student | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<{ student: Student, month: string, amount: number, date: string } | null>(null);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddSupervisorModalOpen, setIsAddSupervisorModalOpen] = useState(false);

  const [newStudent, setNewStudent] = useState({ name: '', phone: '', parentPhone: '', grade: '', groupId: '', isExempted: false });
  const [newGroup, setNewGroup] = useState({ name: '', grade: '', day1: '', day2: '', time: '' });
  const [newExpense, setNewExpense] = useState({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [newSupervisor, setNewSupervisor] = useState({ name: '', username: '', password: '' });

  const [monthlyAmountInputs, setMonthlyAmountInputs] = useState<{ [monthKey: string]: string }>({});
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const currentMonthKey = `${attendanceYear}-${attendanceMonth + 1}`;

  // Auth Functions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
    } else {
      setLoginError('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  const isAdmin = currentUser?.role === 'admin';

  // WhatsApp helper
  const sendWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.startsWith('0') ? '2' + phone : phone;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const paidThisMonth = students.filter(s => s.paidMonths.includes(currentMonthKey) || s.isExempted).length;
    
    return {
      studentCount: students.length,
      todayAttendance: students.filter(s => s.attendance.includes(new Date().toISOString().split('T')[0])).length,
      income,
      expenses,
      profit: income - expenses,
      collectionRate: students.length > 0 ? (paidThisMonth / students.length) * 100 : 0
    };
  }, [students, transactions, currentMonthKey]);

  const recordPayment = (studentId: string, monthKey: string, amount: number) => {
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student || student.paidMonths.includes(monthKey)) return;

    setStudents(prev => prev.map(s => s.id === studentId ? { 
      ...s, 
      paidMonths: [...s.paidMonths, monthKey],
      payments: { ...s.payments, [monthKey]: amount } 
    } : s));

    const transaction: Transaction = {
      id: `TR${Date.now()}`,
      type: 'income',
      amount,
      category: 'مصاريف شهرية',
      date: new Date().toISOString().split('T')[0],
      description: `مصاريف شهر ${MONTHS_AR[parseInt(monthKey.split('-')[1]) - 1]} للطالب ${student.name}`
    };
    setTransactions(prev => [transaction, ...prev]);
    setReceiptToPrint({ student, month: MONTHS_AR[parseInt(monthKey.split('-')[1]) - 1], amount, date: new Date().toLocaleDateString('ar-EG') });
    
    setMonthlyAmountInputs(prev => {
      const copy = {...prev};
      delete copy[monthKey];
      return copy;
    });
  };

  const addExpense = () => {
    if (!newExpense.amount || !newExpense.category) {
      alert("يرجى ملء المبلغ والتصنيف");
      return;
    }
    const transaction: Transaction = {
      id: `EX${Date.now()}`,
      type: 'expense',
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      description: newExpense.description || newExpense.category
    };
    setTransactions(prev => [transaction, ...prev]);
    setIsAddExpenseModalOpen(false);
    setNewExpense({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const addSupervisor = () => {
    if (!newSupervisor.username || !newSupervisor.password || !newSupervisor.name) {
      alert("يرجى ملء كافة البيانات");
      return;
    }
    const newUser: User = {
      id: `SUP${Date.now()}`,
      username: newSupervisor.username,
      password: newSupervisor.password,
      name: newSupervisor.name,
      role: 'supervisor'
    };
    setUsers(prev => [...prev, newUser]);
    setIsAddSupervisorModalOpen(false);
    setNewSupervisor({ name: '', username: '', password: '' });
  };

  const deleteSupervisor = (id: string) => {
    if (id === ADMIN_USER.id) return alert('لا يمكن حذف المديرة العامة!');
    if (window.confirm('هل أنتِ متأكدة من حذف هذا المشرف؟')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const recordAttendance = (inputCode: string) => {
    setScannerError(null);
    const code = inputCode.trim().toUpperCase();
    const studentId = code.startsWith('ST') ? code : `ST${code}`;
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      setScannerError("عذراً، كود الطالب غير مسجل بالنظام!");
      setLastScannedStudent(null);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (student.attendance.includes(today)) {
      setLastScannedStudent(student);
      setScannerError("الطالب مسجل حضور بالفعل اليوم.");
      return;
    }

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance: [...s.attendance, today] } : s));
    setLastScannedStudent(student);
  };

  const toggleSessionAttendance = (studentId: string, monthKey: string, sessionIndex: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const currentAttendance = s.sessionAttendance?.[monthKey] || new Array(8).fill(false);
      const newAttendance = [...currentAttendance];
      newAttendance[sessionIndex] = !newAttendance[sessionIndex];
      return {
        ...s,
        sessionAttendance: { ...s.sessionAttendance, [monthKey]: newAttendance }
      };
    }));
  };

  const SidebarLink = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); setSelectedGrade(null); setViewingGroupAttendance(null); }}
      className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${
        activeView === view ? 'bg-pink-600 text-white shadow-lg shadow-pink-100' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-semibold">{label}</span>
    </button>
  );

  const BackButton = ({ onClick, label = "رجوع" }: { onClick: () => void, label?: string }) => (
    <button 
      onClick={onClick} 
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:text-pink-600 hover:border-pink-200 transition-all shadow-sm"
    >
      <ArrowRight size={16} />
      <span>{label}</span>
    </button>
  );

  const MainBackToDashboard = () => (
    <div className="mb-6 no-print">
      <BackButton onClick={() => { setActiveView('dashboard'); setSelectedGrade(null); setViewingGroupAttendance(null); }} label="العودة للوحة التحكم" />
    </div>
  );

  const VisualBarcode = ({ code }: { code: string }) => {
    return (
      <div className="flex items-end justify-center h-12 w-full bg-white p-1 gap-[2px]">
        {code.split('').map((char, i) => (
          <React.Fragment key={i}>
            <div className={`h-full bg-black ${parseInt(char) % 2 === 0 ? 'w-[3px]' : 'w-[1px]'}`} />
            <div className="h-full bg-white w-[1px]" />
          </React.Fragment>
        ))}
        <div className="h-full bg-black w-[4px]" />
        <div className="h-full bg-white w-[1px]" />
        <div className="h-full bg-black w-[1px]" />
      </div>
    );
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in">
          <div className="p-12 bg-gradient-to-br from-pink-500 to-indigo-600 text-white text-center">
            <div className="bg-white/20 p-4 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2">أهلاً بكِ في السنتر</h2>
            <p className="opacity-80 font-bold text-sm">يرجى تسجيل الدخول للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="p-12 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">اسم المستخدم</label>
              <input required type="text" className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none text-right border-2 border-transparent focus:border-pink-500 transition-all" placeholder="أدخلي الاسم..." value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">كلمة المرور</label>
              <input required type="password" className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none text-right border-2 border-transparent focus:border-pink-500 transition-all" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            {loginError && <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-3 rounded-xl">{loginError}</p>}
            <button type="submit" className="w-full bg-pink-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-[0.98] transition-all">دخول النظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-x-hidden">
      {/* SIDEBAR */}
      <aside className={`no-print fixed lg:static inset-y-0 right-0 w-72 bg-white border-l border-gray-100 z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-pink-500 p-2 rounded-xl text-white shadow-lg shadow-pink-100"><GraduationCap size={24} /></div>
            <div><h1 className="text-lg font-bold">{currentUser.name.split(' ')[0]}</h1><p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">{currentUser.role === 'admin' ? 'إدارة عليا' : 'مشرف'}</p></div>
          </div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><X /></button>
        </div>
        <nav className="p-4 space-y-2">
          <SidebarLink view="dashboard" icon={LayoutDashboard} label="لوحة التحكم" />
          <SidebarLink view="attendance-scanner" icon={Camera} label="ماسح الباركود" />
          <SidebarLink view="students" icon={Users} label="قائمة الطلاب" />
          <SidebarLink view="classes" icon={BookOpen} label="المجموعات" />
          <SidebarLink view="finance" icon={Wallet} label="الحسابات المالية" />
          {isAdmin && <SidebarLink view="supervisors" icon={ShieldCheck} label="إدارة المشرفين" />}
          <SidebarLink view="ai-insights" icon={Sparkles} label="تحليل Gemini" />
          
          <div className="pt-8 mt-8 border-t border-gray-50">
             <button onClick={handleLogout} className="flex items-center gap-3 w-full p-4 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold">
                <LogOut size={20} />
                <span>تسجيل الخروج</span>
             </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="no-print bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex gap-3">
                <button onClick={() => setIsAddGroupModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-100"><FolderPlus size={14}/> مجموعة جديدة</button>
                <button onClick={() => setIsAddStudentModalOpen(true)} className="px-4 py-2 bg-pink-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-100"><Plus size={14}/> تسجيل طالب</button>
             </div>
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} className="w-10 h-10 rounded-full border-2 border-pink-100" alt="profile" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in no-print text-right">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
                  <p className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-widest">إجمالي الطلاب</p>
                  <h3 className="text-2xl font-black">{stats.studentCount}</h3>
                </div>
                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                  <p className="opacity-80 text-[10px] font-bold mb-1 uppercase tracking-widest">إجمالي الدخل</p>
                  <h3 className="text-2xl font-black">{stats.income} ج.م</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
                  <p className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-widest">مصروفات السنتر</p>
                  <h3 className="text-2xl font-black text-red-500">{stats.expenses} ج.م</h3>
                </div>
                <div className="bg-pink-600 p-6 rounded-3xl text-white shadow-xl shadow-pink-100">
                  <p className="opacity-80 text-[10px] font-bold mb-1 uppercase tracking-widest">صافي الربح</p>
                  <h3 className="text-2xl font-black">{stats.profit} ج.م</h3>
                </div>
              </div>
            </div>
          )}

          {activeView === 'classes' && !viewingGroupAttendance && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 no-print text-right">
              <MainBackToDashboard />
              {!selectedGrade ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                  {GRADES_LIST.map(grade => (
                    <button key={grade} onClick={() => setSelectedGrade(grade)} className="bg-white p-12 rounded-[2.5rem] border border-gray-50 shadow-sm text-right hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                       <BookOpen size={32} className="text-indigo-600 mb-6 relative" />
                       <h3 className="text-2xl font-black text-gray-800 relative">{grade}</h3>
                       <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest relative">عرض المجموعات والمواعيد</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                   <div className="flex items-center gap-4">
                     <BackButton onClick={() => setSelectedGrade(null)} label="رجوع لاختيار الصف" />
                     <h2 className="text-3xl font-black text-gray-800">{selectedGrade}</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {groups.filter(g => g.grade === selectedGrade).map(g => (
                        <div key={g.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative group hover:shadow-xl transition-all">
                           <button onClick={(e) => { e.stopPropagation(); if(window.confirm('حذف المجموعة؟')) setGroups(prev=>prev.filter(gr=>gr.id!==g.id)); }} className="absolute top-6 left-6 text-red-500 p-2 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm z-20"><Trash2 size={20}/></button>
                           <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6"><Users size={24} /></div>
                           <h4 className="font-black text-xl text-gray-800 mb-2">{g.name}</h4>
                           <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-8"><Calendar size={14} /><span>{g.schedule}</span></div>
                           <button onClick={() => setViewingGroupAttendance(g)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"><UserCheck size={18}/> إدارة الحضور</button>
                        </div>
                      ))}
                      <button onClick={() => setIsAddGroupModalOpen(true)} className="border-4 border-dashed border-gray-200 p-8 rounded-[2.5rem] text-gray-300 hover:border-indigo-300 hover:text-indigo-500 transition-all flex flex-col items-center justify-center gap-4 h-full min-h-[250px] bg-white/50">
                         <Plus size={48} /><span className="font-black text-xl">إضافة مجموعة جديدة</span>
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'classes' && viewingGroupAttendance && (
            <div className="space-y-6 animate-in slide-in-from-left-4 text-right">
              <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <BackButton onClick={() => setViewingGroupAttendance(null)} label="رجوع للمجموعات" />
                  <div>
                    <h2 className="text-2xl font-black text-gray-800">{viewingGroupAttendance.name}</h2>
                    <p className="text-sm text-indigo-500 font-bold uppercase tracking-wider">{viewingGroupAttendance.schedule}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center gap-2"><Printer size={16}/> طباعة الكشف</button>
                </div>
              </div>
              <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[11px] font-black uppercase tracking-widest">
                        <th className="px-8 py-6 border-b min-w-[220px]">اسم الطالب</th>
                        {[...Array(8)].map((_, i) => <th key={i} className="px-2 py-6 border-b text-center">ح {i+1}</th>)}
                        <th className="px-8 py-6 border-b text-center">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {students.filter(s => s.groupId === viewingGroupAttendance.id).map(s => {
                        const mKey = `${attendanceYear}-${attendanceMonth + 1}`;
                        const sess = s.sessionAttendance?.[mKey] || new Array(8).fill(false);
                        return (
                          <tr key={s.id} className="hover:bg-pink-50/20 transition-colors">
                            <td className="px-8 py-5 font-bold text-sm">{s.name}</td>
                            {[...Array(8)].map((_, i) => (
                              <td key={i} className="px-2 py-5 text-center">
                                <button onClick={() => toggleSessionAttendance(s.id, mKey, i)} className={`no-print w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${sess[i] ? 'bg-pink-600 border-pink-600 text-white' : 'border-gray-200 hover:border-pink-300'}`}>
                                  <CheckCircle2 size={14} className={sess[i] ? 'block' : 'hidden'} />
                                </button>
                                <span className="hidden print:block font-black text-xl">{sess[i] ? '✓' : '—'}</span>
                              </td>
                            ))}
                            <td className="px-8 py-5 text-center font-black text-sm text-pink-600">{sess.filter(v=>v).length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'supervisors' && isAdmin && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 no-print text-right">
               <MainBackToDashboard />
               <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800">إدارة المشرفين</h2>
                <button onClick={() => setIsAddSupervisorModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-100"><UserPlus size={16}/> إضافة مشرف جديد</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                   <div key={u.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm relative group">
                      {u.role !== 'admin' && (
                        <button onClick={() => deleteSupervisor(u.id)} className="absolute top-6 left-6 text-red-500 p-2 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={16}/></button>
                      )}
                      <div className="flex items-center gap-4">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-14 h-14 rounded-2xl bg-indigo-50" />
                        <div>
                          <h4 className="font-black text-gray-800">{u.name}</h4>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'text-pink-600' : 'text-indigo-500'}`}>{u.role === 'admin' ? 'مدير عام' : 'مشرف'}</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-3">
                         <div className="bg-gray-100 p-2 rounded-lg text-gray-400"><Lock size={12}/></div>
                         <p className="text-xs font-bold text-gray-500">اسم المستخدم: <span className="text-indigo-600">{u.username}</span></p>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'students' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 no-print text-right">
              <MainBackToDashboard />
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800">قائمة الطلاب</h2>
                <button onClick={() => setIsAddStudentModalOpen(true)} className="bg-pink-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-pink-100"><Plus size={16}/> تسجيل طالب جديد</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {students.map(s => (
                  <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner">#{s.id.slice(-4)}</div>
                      <div className="text-right">
                        <h4 className="font-bold text-gray-800 text-lg">{s.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.grade} — {groups.find(g => g.id === s.groupId)?.name || 'بدون مجموعة'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <button onClick={() => setStudentForID(s)} className="p-3 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-600 hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs">
                         <QrCode size={18}/> هوية الطالب
                      </button>
                      <button onClick={() => sendWhatsApp(s.parentPhone, `أهلاً بك يا ولي أمر الطالب ${s.name}...`)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                         <MessageSquare size={18}/>
                      </button>
                      <button onClick={() => setStudentForPayments(s)} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] hover:bg-indigo-600 hover:text-white transition-all">التحصيل المالي</button>
                      {isAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); if (window.confirm('حذف الطالب؟')) setStudents(prev => prev.filter(st => st.id !== s.id)); }} className="p-3 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm">
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'finance' && (
            <div className="space-y-8 animate-in fade-in no-print text-right">
              <MainBackToDashboard />
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800">الحسابات المالية</h2>
                <button onClick={() => setIsAddExpenseModalOpen(true)} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-red-100">
                  <MinusCircle size={16}/> إضافة مصروف جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center gap-5">
                    <div className="bg-green-100 text-green-600 p-5 rounded-[1.5rem]"><ArrowUpCircle size={28}/></div>
                    <div><p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">إجمالي الإيرادات</p><h4 className="text-2xl font-black text-green-600">{stats.income} ج.م</h4></div>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center gap-5">
                    <div className="bg-red-100 text-red-600 p-5 rounded-[1.5rem]"><ArrowDownCircle size={28}/></div>
                    <div><p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">إجمالي المصروفات</p><h4 className="text-2xl font-black text-red-600">{stats.expenses} ج.م</h4></div>
                 </div>
                 <div className="bg-pink-600 p-8 rounded-[2.5rem] shadow-xl shadow-pink-100 flex items-center gap-5 text-white">
                    <div className="bg-white/20 p-5 rounded-[1.5rem]"><DollarSign size={28}/></div>
                    <div><p className="opacity-80 text-[10px] font-bold uppercase tracking-wider">صافي الربح المتبقي</p><h4 className="text-2xl font-black">{stats.profit} ج.م</h4></div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50">
                 <div className="flex items-center gap-3 mb-8">
                   <History className="text-indigo-600" size={24} />
                   <h3 className="text-xl font-black text-gray-800">سجل العمليات المالية الأخير</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-[11px] font-black uppercase tracking-widest">
                          <th className="px-6 py-4 border-b">العملية</th>
                          <th className="px-6 py-4 border-b">التاريخ</th>
                          <th className="px-6 py-4 border-b">التصنيف</th>
                          <th className="px-6 py-4 border-b">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transactions.map(t => (
                          <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                {t.type === 'income' ? <ArrowUpCircle className="text-green-500" size={16}/> : <ArrowDownCircle className="text-red-500" size={16}/>}
                                <span className="font-bold text-sm text-gray-700">{t.description}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-xs font-bold text-gray-400">{t.date}</td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {t.category}
                              </span>
                            </td>
                            <td className={`px-6 py-5 font-black text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'}{t.amount} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}

          {activeView === 'attendance-scanner' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in no-print text-center">
               <MainBackToDashboard />
               <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-50 space-y-8">
                  <div className="w-24 h-24 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><QrCode size={48} /></div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-800">ماسح الحضور والغياب</h2>
                    <p className="text-gray-400 font-bold mt-2">قم بمسح الباركود الخاص بالطالب لتسجيل حضوره فوراً</p>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-pink-400 group-focus-within:text-pink-600 transition-colors"><Camera size={24} /></div>
                    <input autoFocus type="text" placeholder="مسح الباركود هنا..." className={`w-full bg-gray-50 pr-16 pl-6 py-6 rounded-[2rem] text-center font-black text-2xl outline-none border-4 transition-all shadow-inner ${scannerError ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-pink-500'}`} onKeyDown={e => { if (e.key === 'Enter') { recordAttendance((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
                  </div>

                  {scannerError && <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-200 text-red-600 font-black flex items-center justify-center gap-3"><AlertCircle size={24}/> {scannerError}</div>}
                  {lastScannedStudent && !scannerError && (
                    <div className="bg-green-50 p-8 rounded-[2.5rem] flex items-center justify-between border-2 border-green-200 animate-in bounce-in text-right">
                       <div>
                          <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">تم تسجيل الحضور بنجاح</p>
                          <h3 className="font-black text-green-800 text-xl">{lastScannedStudent.name}</h3>
                          <p className="text-sm font-bold text-green-700">{lastScannedStudent.grade}</p>
                       </div>
                       <div className="bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-100"><CheckCircle2 size={32}/></div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeView === 'ai-insights' && (
            <div className="space-y-6 animate-in fade-in no-print text-right">
               <MainBackToDashboard />
               <AIInsightsView students={students} transactions={transactions} />
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* MODAL: Add Group */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-4 backdrop-blur-md no-print text-right">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-bottom-10">
            <h3 className="text-2xl font-black text-indigo-600 mb-10 flex items-center gap-3"><FolderPlus size={32} /> مجموعة جديدة</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const fullSchedule = `${newGroup.day1} و ${newGroup.day2} الساعة ${newGroup.time}`;
              setGroups(prev => [...prev, { id: `g${Date.now()}`, name: newGroup.name, grade: newGroup.grade, schedule: fullSchedule }]);
              setIsAddGroupModalOpen(false);
              setNewGroup({ name: '', grade: '', day1: '', day2: '', time: '' });
            }} className="space-y-5">
              <input required className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none text-right" placeholder="اسم المجموعة" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
              <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-right" value={newGroup.grade} onChange={e => setNewGroup({...newGroup, grade: e.target.value})}>
                <option value="">اختر الصف</option>
                {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                 <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-xs text-right" value={newGroup.day2} onChange={e => setNewGroup({...newGroup, day2: e.target.value})}>
                    <option value="">اليوم الثاني</option>
                    {DAYS_AR.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
                 <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-xs text-right" value={newGroup.day1} onChange={e => setNewGroup({...newGroup, day1: e.target.value})}>
                    <option value="">اليوم الأول</option>
                    {DAYS_AR.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
              </div>
              <input required className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none text-right" placeholder="الوقت (مثال: 4 عصرًا)" value={newGroup.time} onChange={e => setNewGroup({...newGroup, time: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl">حفظ المجموعة</button>
                <button type="button" onClick={() => setIsAddGroupModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[1.5rem] font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Supervisor */}
      {isAddSupervisorModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-4 backdrop-blur-md no-print text-right">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-bottom-10">
            <h3 className="text-2xl font-black text-indigo-600 mb-10 flex items-center gap-3"><UserPlus size={32} /> إضافة مشرف جديد</h3>
            <form onSubmit={e => { e.preventDefault(); addSupervisor(); }} className="space-y-5">
              <input required className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none text-right" placeholder="اسم المشرف الثلاثي" value={newSupervisor.name} onChange={e => setNewSupervisor({...newSupervisor, name: e.target.value})} />
              <input required className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none text-right" placeholder="اسم المستخدم (للدخول)" value={newSupervisor.username} onChange={e => setNewSupervisor({...newSupervisor, username: e.target.value})} />
              <input required type="password" className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none text-right" placeholder="كلمة المرور" value={newSupervisor.password} onChange={e => setNewSupervisor({...newSupervisor, password: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl">حفظ المشرف</button>
                <button type="button" onClick={() => setIsAddSupervisorModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[1.5rem] font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[500] flex items-center justify-center p-4 backdrop-blur-md no-print text-right">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-bottom-10">
            <h3 className="text-2xl font-black text-red-600 mb-10 flex items-center gap-3"><MinusCircle size={32} /> إضافة مصروف جديد</h3>
            <form onSubmit={e => { e.preventDefault(); addExpense(); }} className="space-y-5">
              <input required type="number" className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none text-right text-xl" placeholder="المبلغ (ج.م)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
              <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-right" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                <option value="">اختر التصنيف</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-right outline-none min-h-[100px]" placeholder="ملاحظات إضافية (اختياري)" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})}></textarea>
              <input required type="date" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-right outline-none" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-red-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl">حفظ المصروف</button>
                <button type="button" onClick={() => setIsAddExpenseModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[1.5rem] font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Student ID Card */}
      {studentForID && (
        <div className="fixed inset-0 bg-black/80 z-[600] flex items-center justify-center p-4 backdrop-blur-md no-print text-right">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
             <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center relative">
                <button onClick={() => setStudentForID(null)} className="absolute top-4 left-4 bg-white/20 p-2 rounded-xl hover:bg-white/40"><X size={20}/></button>
                <div className="w-20 h-20 bg-white p-1 rounded-full mx-auto mb-4 border-4 border-indigo-400 shadow-xl overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentForID.id}`} className="w-full h-full" alt="avatar" />
                </div>
                <h3 className="text-lg font-black tracking-tight leading-tight">سنتر مس آلاء نجيب</h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">بطاقة هوية الطالب الذكية</p>
             </div>
             <div className="p-8 space-y-6 text-center">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">اسم الطالب</p>
                   <h4 className="text-xl font-black text-gray-800">{studentForID.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-gray-50 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">الصف الدراسي</p>
                      <p className="text-xs font-black text-indigo-600">{studentForID.grade}</p>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">كود الطالب</p>
                      <p className="text-xs font-black text-indigo-600">{studentForID.id.replace('ST', '')}</p>
                   </div>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-100">
                   <VisualBarcode code={studentForID.id.replace('ST', '')} />
                   <p className="text-[10px] font-black font-mono mt-2 text-gray-500 tracking-[0.5em]">{studentForID.id}</p>
                </div>
             </div>
             <div className="p-6 bg-gray-50 flex gap-3">
                <button onClick={() => window.print()} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-xs"><Printer size={16}/> طباعة الكارت</button>
                <button onClick={() => setStudentForID(null)} className="px-6 py-4 bg-gray-200 text-gray-700 rounded-2xl font-black text-xs">إغلاق</button>
             </div>
          </div>
        </div>
      )}

      {/* Register Modals kept for full logic */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[500] flex items-center justify-center p-4 no-print backdrop-blur-md text-right">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-bottom-20">
            <h3 className="text-2xl font-black mb-10 text-pink-600">تسجيل طالب جديد</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const s: Student = { id: `ST${Date.now()}`, name: newStudent.name, grade: newStudent.grade, groupId: newStudent.groupId, phone: newStudent.phone, parentPhone: newStudent.parentPhone, balance: 0, isExempted: newStudent.isExempted, grades: [], attendance: [], paidMonths: [], payments: {}, sessionAttendance: {} };
              setStudents(prev => [...prev, s]);
              setIsAddStudentModalOpen(false);
              setNewStudent({ name: '', phone: '', parentPhone: '', grade: '', groupId: '', isExempted: false });
            }} className="space-y-5">
              <input required className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none text-right" placeholder="الاسم الرباعي" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select required className="w-full bg-gray-50 p-5 rounded-2xl font-bold text-right" value={newStudent.groupId} onChange={e => setNewStudent({...newStudent, groupId: e.target.value})}>
                  <option value="">المجموعة</option>
                  {groups.filter(g => g.grade === newStudent.grade).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select required className="w-full bg-gray-50 p-5 rounded-2xl font-bold text-right" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})}>
                  <option value="">السنة الدراسية</option>
                  {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <input required className="w-full bg-gray-50 p-5 rounded-2xl font-bold text-right" placeholder="رقم الموبايل (واتساب)" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
              <input required className="w-full bg-gray-50 p-5 rounded-2xl font-bold text-right" placeholder="رقم ولي الأمر" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-pink-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl">تسجيل الطالب</button>
                <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[1.5rem] font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {studentForPayments && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4 backdrop-blur-md no-print text-right">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
             <div className="p-10 bg-pink-600 text-white flex justify-between items-center">
                <button onClick={() => setStudentForPayments(null)} className="bg-white/20 p-3 rounded-2xl hover:bg-white/40"><X size={24}/></button>
                <div><h3 className="text-2xl font-black">{studentForPayments.name}</h3></div>
             </div>
             <div className="p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-2">
                  {MONTHS_AR.map((m, idx) => {
                    const mKey = `${attendanceYear}-${idx + 1}`;
                    const isPaid = studentForPayments.paidMonths.includes(mKey);
                    const currentInput = monthlyAmountInputs[mKey] || "";
                    return (
                      <div key={mKey} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-4 ${isPaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          {isPaid && <span className="text-[10px] font-black text-green-600 bg-green-100 px-3 py-1 rounded-full">تم التحصيل</span>}
                          <span className="text-sm font-black">{m}</span>
                        </div>
                        {!isPaid && (
                           <div className="space-y-4">
                              <input type="number" className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 px-6 text-center font-black text-lg outline-none" placeholder="المبلغ..." value={currentInput} onChange={(e) => setMonthlyAmountInputs(prev => ({ ...prev, [mKey]: e.target.value }))} />
                              <button onClick={() => recordPayment(studentForPayments.id, mKey, parseInt(currentInput))} className="w-full bg-pink-600 text-white py-4 rounded-2xl text-[10px] font-black">تأكيد التحصيل</button>
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AIInsightsView: React.FC<{ students: Student[], transactions: Transaction[] }> = ({ students, transactions }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fetchInsights = async () => { setLoading(true); const data = await getAIInsights(students, transactions); setInsights(data); setLoading(false); };
  useEffect(() => { fetchInsights(); }, []);
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-12 rounded-[3rem] text-white shadow-2xl flex items-center justify-between">
        <button onClick={fetchInsights} disabled={loading} className="bg-white text-indigo-600 p-6 rounded-[2rem] disabled:opacity-50 shadow-xl"><ReceiptIcon className={loading ? 'animate-spin' : ''} size={32} /></button>
        <div className="text-right"><h2 className="text-3xl font-black mb-3">مساعد Gemini الذكي</h2><p className="opacity-90 font-bold text-lg">تحليل شامل لأداء السنتر ومقترحات للنمو.</p></div>
      </div>
      {insights ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 md:col-span-2"><h3 className="text-xl font-black mb-6 text-pink-600">حالة السنتر</h3><p className="font-bold text-gray-600 text-lg leading-relaxed">{insights.currentStatus}</p></div>
        </div>
      ) : (loading && <div className="text-center py-20 opacity-40 text-indigo-600 font-black flex flex-col items-center gap-4"><Sparkles className="animate-pulse" size={48} /> جاري التحليل مع Gemini...</div>)}
    </div>
  );
};

export default App;
