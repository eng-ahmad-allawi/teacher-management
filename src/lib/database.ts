import Dexie, { Table } from 'dexie';

// تعريف أنواع البيانات
export interface Subject {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Institute {
  id?: number;
  name: string;
  type: 'institute' | 'school';
  accountId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id?: number;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
}

export interface Account {
  id?: number;
  entityId: number;
  entityName: string;
  entityType: 'institute' | 'school';
  totalPayments: number;
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id?: number;
  type: 'private' | 'institute' | 'school'; // إضافة الدروس الخصوصية
  entityName: string; // اسم الطالب للدروس الخصوصية أو اسم المعهد/المدرسة
  entityId?: number; // اختياري للدروس الخصوصية
  subjectId: number;
  subjectName: string;
  startTime: string; // HH:mm format
  endTime?: string; // اختياري للدروس الخصوصية
  date?: string; // YYYY-MM-DD للمواعيد الفردية
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) للمواعيد المتكررة
  isRepeating: boolean;
  repeatStartDate?: string; // YYYY-MM-DD تاريخ بدء التكرار
  repeatEndDate?: string; // YYYY-MM-DD تاريخ انتهاء التكرار
  sessionType?: 'شتوي' | 'صيفي' | 'مكثفات' | 'امتحانية'; // للمعاهد والمدارس فقط
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// فئة قاعدة البيانات
export class TeacherManagementDB extends Dexie {
  subjects!: Table<Subject>;
  institutes!: Table<Institute>;
  accounts!: Table<Account>;
  appointments!: Table<Appointment>;

  constructor() {
    super('TeacherManagementDB');
    
    this.version(1).stores({
      subjects: '++id, name, createdAt, updatedAt',
      institutes: '++id, name, type, accountId, createdAt, updatedAt',
      accounts: '++id, entityId, entityName, entityType, totalPayments, createdAt, updatedAt',
      appointments: '++id, type, entityId, subjectId, date, dayOfWeek, isRepeating, sessionType, createdAt, updatedAt'
    });

    // إضافة hooks للتواريخ التلقائية
    this.subjects.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.subjects.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.institutes.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.institutes.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.accounts.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.accounts.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.appointments.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.appointments.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });
  }

  // دوال مساعدة للمواد
  async addSubject(name: string): Promise<number> {
    return await this.subjects.add({
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await this.subjects.orderBy('name').toArray();
  }

  async deleteSubject(id: number): Promise<void> {
    await this.subjects.delete(id);
  }

  // دوال مساعدة للمعاهد والمدارس
  async addInstitute(name: string, type: 'institute' | 'school' = 'institute'): Promise<number> {
    const instituteId = await this.institutes.add({
      name,
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // إنشاء حساب مالي تلقائياً
    const accountId = await this.accounts.add({
      entityId: instituteId,
      entityName: name,
      entityType: type,
      totalPayments: 0,
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // ربط المعهد/المدرسة بالحساب
    await this.institutes.update(instituteId, { accountId });

    return instituteId;
  }

  async addSchool(name: string): Promise<number> {
    return await this.addInstitute(name, 'school');
  }

  async getAllInstitutes(): Promise<Institute[]> {
    return await this.institutes.orderBy('name').toArray();
  }

  async getInstitutesByType(type: 'institute' | 'school'): Promise<Institute[]> {
    return await this.institutes.where('type').equals(type).sortBy('name');
  }

  async updateInstitute(id: number, name: string): Promise<void> {
    const institute = await this.institutes.get(id);
    if (!institute) throw new Error('Institute not found');

    await this.institutes.update(id, { name });

    // تحديث اسم الكيان في الحساب المرتبط
    if (institute.accountId) {
      await this.accounts.update(institute.accountId, { entityName: name });
    }
  }

  async deleteInstitute(id: number): Promise<void> {
    const institute = await this.institutes.get(id);
    if (institute?.accountId) {
      await this.accounts.delete(institute.accountId);
    }
    await this.institutes.delete(id);
  }

  // دوال مساعدة للحسابات
  async addPayment(accountId: number, amount: number, description?: string): Promise<void> {
    const account = await this.accounts.get(accountId);
    if (!account) throw new Error('Account not found');

    const payment: Payment = {
      amount,
      date: new Date(),
      description,
      createdAt: new Date()
    };

    const updatedPayments = [...account.payments, payment];
    const newTotal = account.totalPayments + amount;

    await this.accounts.update(accountId, {
      payments: updatedPayments,
      totalPayments: newTotal,
      updatedAt: new Date()
    });
  }

  async getAllAccounts(): Promise<Account[]> {
    return await this.accounts.orderBy('entityName').toArray();
  }

  async getAccount(accountId: number): Promise<Account | undefined> {
    return await this.accounts.get(accountId);
  }

  async getAccountByEntityId(entityId: number): Promise<Account | undefined> {
    return await this.accounts.where('entityId').equals(entityId).first();
  }

  async updatePayment(accountId: number, paymentIndex: number, amount: number, date: Date, description?: string): Promise<void> {
    const account = await this.accounts.get(accountId);
    if (!account) throw new Error('Account not found');
    if (paymentIndex < 0 || paymentIndex >= account.payments.length) {
      throw new Error('Payment not found');
    }

    const oldAmount = account.payments[paymentIndex].amount;
    const updatedPayments = [...account.payments];
    updatedPayments[paymentIndex] = {
      ...updatedPayments[paymentIndex],
      amount,
      date,
      description
    };

    const newTotal = account.totalPayments - oldAmount + amount;

    await this.accounts.update(accountId, {
      payments: updatedPayments,
      totalPayments: newTotal,
      updatedAt: new Date()
    });
  }

  async deletePayment(accountId: number, paymentIndex: number): Promise<void> {
    const account = await this.accounts.get(accountId);
    if (!account) throw new Error('Account not found');
    if (paymentIndex < 0 || paymentIndex >= account.payments.length) {
      throw new Error('Payment not found');
    }

    const paymentAmount = account.payments[paymentIndex].amount;
    const updatedPayments = account.payments.filter((_, index) => index !== paymentIndex);
    const newTotal = account.totalPayments - paymentAmount;

    await this.accounts.update(accountId, {
      payments: updatedPayments,
      totalPayments: newTotal,
      updatedAt: new Date()
    });
  }

  async getPaymentsByDateRange(accountId: number, startDate: Date, endDate: Date): Promise<Payment[]> {
    const account = await this.accounts.get(accountId);
    if (!account) return [];

    return account.payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }

  async getTotalPaymentsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    const accounts = await this.getAllAccounts();
    let total = 0;

    for (const account of accounts) {
      const payments = account.payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
      total += payments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    return total;
  }

  async getAccountsWithPaymentStats(): Promise<(Account & { recentPayments: number; lastPaymentDate?: Date })[]> {
    const accounts = await this.getAllAccounts();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return accounts.map(account => {
      const recentPayments = account.payments.filter(payment =>
        new Date(payment.date) >= oneWeekAgo
      ).reduce((sum, payment) => sum + payment.amount, 0);

      const lastPaymentDate = account.payments.length > 0
        ? new Date(Math.max(...account.payments.map(p => new Date(p.date).getTime())))
        : undefined;

      return {
        ...account,
        recentPayments,
        lastPaymentDate
      };
    });
  }

  // دوال مساعدة للمواعيد
  async addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    return await this.appointments.add({
      ...appointment,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await this.appointments.orderBy('createdAt').reverse().toArray();
  }

  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    return await this.appointments.get(id);
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<void> {
    await this.appointments.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteAppointment(id: number): Promise<void> {
    await this.appointments.delete(id);
  }

  // دوال للمواعيد المتكررة
  async getAppointmentsByDayOfWeek(dayOfWeek: number): Promise<Appointment[]> {
    // dayOfWeek هنا يجب أن يكون بالترتيب الجديد (السبت=0, الأحد=1, إلخ)
    return await this.appointments
      .where('dayOfWeek')
      .equals(dayOfWeek)
      .and(appointment => appointment.isRepeating)
      .toArray();
  }

  // دالة للحصول على مواعيد يوم معين (فردية ومتكررة)
  async getAppointmentsForDate(date: string): Promise<Appointment[]> {
    const jsDate = new Date(date);
    const dayOfWeek = jsDate.getDay();

    // تحويل dayOfWeek ليتوافق مع الترتيب الجديد (السبت=0, الأحد=1, إلخ)
    const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

    // المواعيد الفردية لهذا التاريخ
    const singleAppointments = await this.appointments
      .where('date')
      .equals(date)
      .and(appointment => !appointment.isRepeating)
      .toArray();

    // المواعيد المتكررة لهذا اليوم من الأسبوع
    const recurringAppointments = await this.appointments
      .where('dayOfWeek')
      .equals(adjustedDayOfWeek)
      .and(appointment => {
        if (!appointment.isRepeating) return false;

        const appointmentDate = new Date(date);
        const startDate = appointment.repeatStartDate ? new Date(appointment.repeatStartDate) : new Date(0);
        const endDate = appointment.repeatEndDate ? new Date(appointment.repeatEndDate) : new Date('2099-12-31');

        return appointmentDate >= startDate && appointmentDate <= endDate;
      })
      .toArray();

    return [...singleAppointments, ...recurringAppointments];
  }

  // دالة للحصول على مواعيد أسبوع معين
  async getAppointmentsForWeek(startDate: string): Promise<Appointment[]> {
    const appointments: Appointment[] = [];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      const dayAppointments = await this.getAppointmentsForDate(dateString);
      appointments.push(...dayAppointments);
    }

    return appointments;
  }

  // دالة للتحقق من تعارض المواعيد
  async checkAppointmentConflict(
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): Promise<boolean> {
    const existingAppointments = await this.getAppointmentsForDate(date);

    return existingAppointments.some(appointment => {
      if (excludeId && appointment.id === excludeId) return false;

      const existingStart = appointment.startTime;
      const existingEnd = appointment.endTime || appointment.startTime;

      // التحقق من التداخل في الأوقات
      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });
  }

  // دالة مسح جميع بيانات الحسابات
  async clearAllAccounts(): Promise<void> {
    await this.transaction('rw', this.accounts, async () => {
      await this.accounts.clear();
    });
  }

  // دالة مسح جميع بيانات المواعيد
  async clearAllAppointments(): Promise<void> {
    await this.transaction('rw', this.appointments, async () => {
      await this.appointments.clear();
    });
  }

  // دالة مسح جميع البيانات
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.subjects, this.institutes, this.accounts, this.appointments, async () => {
      await this.subjects.clear();
      await this.institutes.clear();
      await this.accounts.clear();
      await this.appointments.clear();
    });
  }
}

// إنشاء مثيل واحد من قاعدة البيانات
export const db = new TeacherManagementDB();
