import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

// --- GENERADOR DE DÍAS LABORALES (CUU6.1 / CUU6.2) ---
// Genera todos los días Martes-Sábado del mes actual + 2 meses siguientes
const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const generateWorkingDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = firstOfMonth.getFullYear();
    const month = firstOfMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeekIndex = date.getDay(); // 0=Dom, 1=Lun, 2=Mar ... 6=Sáb
      // Solo Martes(2) a Sábado(6) — Domingos y Lunes son no laborables
      if (dayOfWeekIndex !== 0 && dayOfWeekIndex !== 1) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = DAY_NAMES_ES[dayOfWeekIndex];
        days.push({
          id: `wd_${dateStr}`,
          date: dateStr,
          fecha: dateStr,
          dayOfWeek: dayOfWeek,
          diaSemana: dayOfWeek,
          status: 'Habilitado', // 'Habilitado' | 'Deshabilitado' (Máquina de estados workingDay)
          estado: 'Habilitado',
          startTime: '08:00',
          horarioInicio: '08:00',
          endTime: '20:00',
          horarioFin: '20:00',
        });
      }
    }
  }
  return days;
};

// Normaliza días guardados en localStorage (acepta formato viejo o nuevo)
const normalizeWorkingDay = (day) => {
  const date = day.date || day.fecha;
  const dayOfWeek = day.dayOfWeek || day.diaSemana;
  const status = day.status || day.estado || 'Habilitado';
  const startTime = day.startTime || day.horarioInicio || '08:00';
  const endTime = day.endTime || day.horarioFin || '20:00';
  return {
    id: day.id || `wd_${date}`,
    date,
    fecha: date,
    dayOfWeek,
    diaSemana: dayOfWeek,
    status,
    estado: status,
    startTime,
    horarioInicio: startTime,
    endTime,
    horarioFin: endTime,
  };
};

// Servicios iniciales predeterminados (CUU7.1, CUU7.2)
export const INITIAL_SERVICES = [
  {
    id: 's1',
    name: 'Corte Tradicional',
    nombre: 'Corte Tradicional',
    durationMinutes: 30,
    duracionMinutos: 30,
    price: 4500,
    precio: 4500,
    description: 'Corte de cabello clásico o moderno con asesoramiento de estilo y acabado.',
    descripcion: 'Corte de cabello clásico o moderno con asesoramiento de estilo y acabado.',
    status: 'Habilitado', // 'Habilitado' | 'Deshabilitado' (Máquina de estados de Servicios)
    estado: 'Habilitado',
  },
  {
    id: 's2',
    name: 'Arreglo de Barba',
    nombre: 'Arreglo de Barba',
    durationMinutes: 20,
    duracionMinutos: 20,
    price: 3000,
    precio: 3000,
    description: 'Diseño, perfilado, rebajado de barba y toalla caliente.',
    descripcion: 'Diseño, perfilado, rebajado de barba y toalla caliente.',
    status: 'Habilitado',
    estado: 'Habilitado',
  },
  {
    id: 's3',
    name: 'Combo Corte + Barba',
    nombre: 'Combo Corte + Barba',
    durationMinutes: 45,
    duracionMinutos: 45,
    price: 6500,
    precio: 6500,
    description: 'Servicio completo de corte de cabello y arreglo de barba profesional.',
    descripcion: 'Servicio completo de corte de cabello y arreglo de barba profesional.',
    status: 'Habilitado',
    estado: 'Habilitado',
  },
  {
    id: 's4',
    name: 'Tintura / Coloración',
    nombre: 'Tintura / Coloración',
    durationMinutes: 60,
    duracionMinutos: 60,
    price: 8500,
    precio: 8500,
    description: 'Aplicación de tintura, mechas o camuflaje de canas.',
    descripcion: 'Aplicación de tintura, mechas o camuflaje de canas.',
    status: 'Habilitado',
    estado: 'Habilitado',
  },
  {
    id: 's5',
    name: 'Perfilado de Cejas',
    nombre: 'Perfilado de Cejas',
    durationMinutes: 15,
    duracionMinutos: 15,
    price: 2000,
    precio: 2000,
    description: 'Depilación y diseño de cejas con navaja/pinza.',
    descripcion: 'Depilación y diseño de cejas con navaja/pinza.',
    status: 'Habilitado',
    estado: 'Habilitado',
  },
];

// Normaliza un servicio guardado (acepta formato viejo o nuevo)
const normalizeService = (service) => {
  const name = service.name || service.nombre;
  const durationMinutes = service.durationMinutes ?? service.duracionMinutos ?? 30;
  const price = service.price ?? service.precio ?? 0;
  const description = service.description ?? service.descripcion ?? '';
  const status = service.status || service.estado || 'Habilitado';
  return {
    id: service.id,
    name,
    nombre: name,
    durationMinutes,
    duracionMinutos: durationMinutes,
    price,
    precio: price,
    description,
    descripcion: description,
    status,
    estado: status,
  };
};

// Empleados iniciales (CUU10.1, CUU10.2, CUU10.3, CUU6.3)
export const INITIAL_EMPLOYEES = [
  {
    id: 'e1',
    name: 'Nicolas Rodrigo Gutierrez Fernandez',
    nombre: 'Nicolas Rodrigo Gutierrez Fernandez',
    email: 'empleado@barberazo.com',
    phone: '341-5554321',
    telefono: '341-5554321',
    specialties: ['Corte Tradicional', 'Arreglo de Barba', 'Combo Corte + Barba'],
    especialidades: ['Corte Tradicional', 'Arreglo de Barba', 'Combo Corte + Barba'],
    schedule: {
      enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningShift: { startTime: '08:00', endTime: '12:00' },
      afternoonShift: { startTime: '14:00', endTime: '20:00' },
    },
    horarios: {
      diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      turnoManana: { inicio: '08:00', fin: '12:00' },
      turnoTarde: { inicio: '14:00', fin: '20:00' },
    },
    status: 'Activo',
    estado: 'Activo',
  },
  {
    id: 'e2',
    name: 'Mateo Bertín',
    nombre: 'Mateo Bertín',
    email: 'mateo@barberazo.com',
    phone: '341-5556789',
    telefono: '341-5556789',
    specialties: ['Corte Tradicional', 'Tintura / Coloración', 'Perfilado de Cejas'],
    especialidades: ['Corte Tradicional', 'Tintura / Coloración', 'Perfilado de Cejas'],
    schedule: {
      enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningShift: { startTime: '08:00', endTime: '12:00' },
      afternoonShift: { startTime: '14:00', endTime: '20:00' },
    },
    horarios: {
      diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      turnoManana: { inicio: '08:00', fin: '12:00' },
      turnoTarde: { inicio: '14:00', fin: '20:00' },
    },
    status: 'Activo',
    estado: 'Activo',
  },
];

// Normaliza un empleado guardado (acepta formato viejo o nuevo)
const normalizeEmployee = (employee) => {
  const name = employee.name || employee.nombre;
  const phone = employee.phone || employee.telefono || '';
  const specialties = employee.specialties || employee.especialidades || [];
  const schedule = employee.schedule || {};
  const horarios = employee.horarios || {};
  const enabledDays = schedule.enabledDays || horarios.diasHabilitados || ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const morningShift = schedule.morningShift || {};
  const turnoManana = horarios.turnoManana || {};
  const morningStart = morningShift.startTime || turnoManana.inicio || '08:00';
  const morningEnd = morningShift.endTime || turnoManana.fin || '12:00';
  const afternoonShift = schedule.afternoonShift || {};
  const turnoTarde = horarios.turnoTarde || {};
  const afternoonStart = afternoonShift.startTime || turnoTarde.inicio || '14:00';
  const afternoonEnd = afternoonShift.endTime || turnoTarde.fin || '20:00';
  const status = employee.status || employee.estado || 'Activo';
  return {
    id: employee.id,
    name,
    nombre: name,
    email: employee.email,
    phone,
    telefono: phone,
    specialties,
    especialidades: specialties,
    schedule: {
      enabledDays,
      morningShift: { startTime: morningStart, endTime: morningEnd },
      afternoonShift: { startTime: afternoonStart, endTime: afternoonEnd },
    },
    horarios: {
      diasHabilitados: enabledDays,
      turnoManana: { inicio: morningStart, fin: morningEnd },
      turnoTarde: { inicio: afternoonStart, fin: afternoonEnd },
    },
    status,
    estado: status,
  };
};

// Clientes registrados en el sistema (CUU5.1, CUU5.2)
export const INITIAL_CLIENTS = [
  {
    id: 'c1',
    name: 'Gerónimo Benavides',
    nombre: 'Gerónimo Benavides',
    email: 'cliente@barberazo.com',
    phone: '341-5551234',
    telefono: '341-5551234',
    status: 'Activo', // 'Activo' | 'Bloqueado' | 'Multado' (Máquina de estados de Clientes)
    estado: 'Activo',
    strikes: 0,
    registrationDate: '2026-05-15',
    fechaRegistro: '2026-05-15',
  },
  {
    id: 'c2',
    name: 'Lucas Multini Martino',
    nombre: 'Lucas Multini Martino',
    email: 'multado@barberazo.com',
    phone: '341-5559999',
    telefono: '341-5559999',
    status: 'Multado',
    estado: 'Multado',
    strikes: 3,
    registrationDate: '2026-06-01',
    fechaRegistro: '2026-06-01',
  },
  {
    id: 'c3',
    name: 'Esteban Bloqueado',
    nombre: 'Esteban Bloqueado',
    email: 'esteban@barberazo.com',
    phone: '341-5558888',
    telefono: '341-5558888',
    status: 'Bloqueado',
    estado: 'Bloqueado',
    strikes: 1,
    registrationDate: '2026-04-10',
    fechaRegistro: '2026-04-10',
  },
];

// Normaliza un cliente guardado (acepta formato viejo o nuevo)
const normalizeClient = (client) => {
  const name = client.name || client.nombre;
  const phone = client.phone || client.telefono || '';
  const status = client.status || client.estado || 'Activo';
  const registrationDate = client.registrationDate || client.fechaRegistro || '2026-05-01';
  return {
    id: client.id,
    name,
    nombre: name,
    email: client.email,
    phone,
    telefono: phone,
    status,
    estado: status,
    strikes: client.strikes || 0,
    registrationDate,
    fechaRegistro: registrationDate,
  };
};

// Appointments iniciales de prueba (CUU1.2, CUU1.3, CUU1.5, CUU1.6)
export const INITIAL_APPOINTMENTS = [
  {
    id: 't_1',
    clientId: 4,
    clienteId: 4,
    clientName: 'Gerónimo Benavides',
    clienteNombre: 'Gerónimo Benavides',
    clientEmail: 'cliente@barberazo.com',
    clienteEmail: 'cliente@barberazo.com',
    clientPhone: '341-5551234',
    clienteTelefono: '341-5551234',
    employeeId: 'e1',
    empleadoId: 'e1',
    employeeName: 'Nicolas Rodrigo Gutierrez Fernandez',
    empleadoNombre: 'Nicolas Rodrigo Gutierrez Fernandez',
    serviceId: 's1',
    servicioId: 's1',
    serviceName: 'Corte Tradicional',
    servicioNombre: 'Corte Tradicional',
    servicePrice: 4500,
    servicioPrecio: 4500,
    serviceDuration: 30,
    servicioDuracion: 30,
    date: '2026-09-30',
    fecha: '2026-09-30',
    time: '11:00',
    hora: '11:00',
    status: 'Solicitado',
    estado: 'Solicitado',
    cancelledBy: null,
    canceladoPor: null,
    cancellationReason: null,
    motivoCancelacion: null,
    createdAt: '2026-09-28T14:30:00.000Z',
    fechaCreacion: '2026-09-28T14:30:00.000Z',
  },
  {
    id: 't_2',
    clientId: 4,
    clienteId: 4,
    clientName: 'Gerónimo Benavides',
    clienteNombre: 'Gerónimo Benavides',
    clientEmail: 'cliente@barberazo.com',
    clienteEmail: 'cliente@barberazo.com',
    clientPhone: '341-5551234',
    clienteTelefono: '341-5551234',
    employeeId: 'e2',
    empleadoId: 'e2',
    employeeName: 'Mateo Bertín',
    empleadoNombre: 'Mateo Bertín',
    serviceId: 's3',
    servicioId: 's3',
    serviceName: 'Combo Corte + Barba',
    servicioNombre: 'Combo Corte + Barba',
    servicePrice: 6500,
    servicioPrecio: 6500,
    serviceDuration: 45,
    servicioDuracion: 45,
    date: '2026-09-22',
    fecha: '2026-09-22',
    time: '16:00',
    hora: '16:00',
    status: 'Asistido',
    estado: 'Asistido',
    cancelledBy: null,
    canceladoPor: null,
    cancellationReason: null,
    motivoCancelacion: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    fechaCreacion: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 't_3',
    clientId: 5,
    clienteId: 5,
    clientName: 'Lucas Multini Martino',
    clienteNombre: 'Lucas Multini Martino',
    clientEmail: 'multado@barberazo.com',
    clienteEmail: 'multado@barberazo.com',
    clientPhone: '341-5559999',
    clienteTelefono: '341-5559999',
    employeeId: 'e1',
    empleadoId: 'e1',
    employeeName: 'Nicolas Rodrigo Gutierrez Fernandez',
    empleadoNombre: 'Nicolas Rodrigo Gutierrez Fernandez',
    serviceId: 's2',
    servicioId: 's2',
    serviceName: 'Arreglo de Barba',
    servicioNombre: 'Arreglo de Barba',
    servicePrice: 3000,
    servicioPrecio: 3000,
    serviceDuration: 20,
    servicioDuracion: 20,
    date: '2026-09-25',
    fecha: '2026-09-25',
    time: '17:00',
    hora: '17:00',
    status: 'No-Asistido',
    estado: 'No-Asistido',
    cancelledBy: null,
    canceladoPor: null,
    cancellationReason: 'Inasistencia sin previo aviso',
    motivoCancelacion: 'Inasistencia sin previo aviso',
    createdAt: '2026-09-23T12:00:00.000Z',
    fechaCreacion: '2026-09-23T12:00:00.000Z',
  },
];
export const INITIAL_TURNOS = INITIAL_APPOINTMENTS;

// Fines iniciales de prueba (CUU4.1)
export const INITIAL_FINES = [
  {
    id: 'm_1',
    clientId: 5,
    clienteId: 5,
    clientName: 'Lucas Multini Martino',
    clienteNombre: 'Lucas Multini Martino',
    clientEmail: 'multado@barberazo.com',
    clienteEmail: 'multado@barberazo.com',
    amount: 3000,
    monto: 3000,
    reason: 'Acumulación de 3 strikes por inasistencias o cancelaciones tardías',
    motivo: 'Acumulación de 3 strikes por inasistencias o cancelaciones tardías',
    status: 'Pendiente',
    estado: 'Pendiente',
    issueDate: '2026-09-25',
    fechaEmision: '2026-09-25',
    paymentDate: null,
    fechaPago: null,
    paymentMethod: null,
    metodoPago: null,
  },
];
export const INITIAL_MULTAS = INITIAL_FINES;

export const DataProvider = ({ children }) => {
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('barberazo_services');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed.map(normalizeService);
    }
    return INITIAL_SERVICES;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('barberazo_employees');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed.map(normalizeEmployee);
    }
    return INITIAL_EMPLOYEES;
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('barberazo_clients');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed.map(normalizeClient);
    }
    return INITIAL_CLIENTS;
  });

  // workingDays: Todos los días laborales Martes-Sábado de los próximos 3 meses
  const [workingDays, setWorkingDays] = useState(() => {
    const saved = localStorage.getItem('barberazo_workingDays') || localStorage.getItem('barberazo_diasTrabajo');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Si los datos guardados son de una sesión muy antigua, regenerar
      if (parsed.length > 0) return parsed.map(normalizeWorkingDay);
    }
    return generateWorkingDays();
  });

  const { user, updateUserState } = useAuth();

  // Appointments: Ciclo de vida de turnos y reservas (Fase 4)
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('barberazo_appointments') || localStorage.getItem('barberazo_turnos');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  // Fines: Sanciones por acumulación de 3 strikes (Fase 4)
  const [fines, setFines] = useState(() => {
    const saved = localStorage.getItem('barberazo_fines') || localStorage.getItem('barberazo_multas');
    return saved ? JSON.parse(saved) : INITIAL_FINES;
  });

  useEffect(() => {
    localStorage.setItem('barberazo_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('barberazo_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('barberazo_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('barberazo_workingDays', JSON.stringify(workingDays));
    localStorage.setItem('barberazo_diasTrabajo', JSON.stringify(workingDays));
  }, [workingDays]);

  useEffect(() => {
    localStorage.setItem('barberazo_appointments', JSON.stringify(appointments));
    localStorage.setItem('barberazo_turnos', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('barberazo_fines', JSON.stringify(fines));
    localStorage.setItem('barberazo_multas', JSON.stringify(fines));
  }, [fines]);

  // --- CRUD SERVICIOS (CUU7.1, CUU7.2) ---
  const addService = (newService) => {
    const name = newService.name || newService.nombre;
    const durationMinutes = newService.durationMinutes ?? newService.duracionMinutos ?? 30;
    const price = newService.price ?? newService.precio ?? 0;
    const description = newService.description ?? newService.descripcion ?? '';
    const s = {
      ...newService,
      id: 's_' + Date.now(),
      name,
      nombre: name,
      durationMinutes,
      duracionMinutos: durationMinutes,
      price,
      precio: price,
      description,
      descripcion: description,
      status: 'Habilitado',
      estado: 'Habilitado',
    };
    setServices((prev) => [...prev, s]);
  };

  const updateService = (id, updatedData) => {
    const name = updatedData.name ?? updatedData.nombre;
    const durationMinutes = updatedData.durationMinutes ?? updatedData.duracionMinutos;
    const price = updatedData.price ?? updatedData.precio;
    const description = updatedData.description ?? updatedData.descripcion;
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...updatedData };
        if (name !== undefined) {
          next.name = name;
          next.nombre = name;
        }
        if (durationMinutes !== undefined) {
          next.durationMinutes = durationMinutes;
          next.duracionMinutos = durationMinutes;
        }
        if (price !== undefined) {
          next.price = price;
          next.precio = price;
        }
        if (description !== undefined) {
          next.description = description;
          next.descripcion = description;
        }
        return next;
      })
    );
  };

  const toggleServiceStatus = (id) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const currentStatus = s.status || s.estado;
          const nextStatus = currentStatus === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
          return { ...s, status: nextStatus, estado: nextStatus };
        }
        return s;
      })
    );
  };

  // --- CRUD EMPLEADOS (CUU10.1, CUU10.2, CUU10.3, CUU6.3) ---
  const addEmployee = (newEmployee) => {
    const normalized = normalizeEmployee({
      ...newEmployee,
      id: 'e_' + Date.now(),
      status: 'Activo',
      estado: 'Activo',
    });
    setEmployees((prev) => [...prev, normalized]);
  };

  const updateEmployee = (id, updatedData) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? normalizeEmployee({ ...e, ...updatedData, id }) : e))
    );
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // --- GESTIÓN DE CLIENTES Y BLOQUEOS (CUU5.1, CUU5.2) ---
  const toggleClientBlock = (id) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          // Transición de estados de Clientes
          const currentStatus = c.status || c.estado;
          const nextStatus = currentStatus === 'Bloqueado' ? 'Activo' : 'Bloqueado';
          return { ...c, status: nextStatus, estado: nextStatus };
        }
        return c;
      })
    );
  };

  // --- GESTIÓN DE DÍAS LABORALES / CALENDARIO (CUU6.1, CUU6.2) ---

  // CUU6.1 Habilitar Fecha / CUU6.2 Deshabilitar Fecha
  // Alterna el estado de un workingDay entre 'Habilitado' y 'Deshabilitado'
  const toggleDayStatus = (date) => {
    setWorkingDays((prev) =>
      prev.map((day) => {
        const dayDate = day.date || day.fecha;
        if (dayDate === date) {
          const currentStatus = day.status || day.estado;
          const nextStatus = currentStatus === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
          return { ...day, date: dayDate, fecha: dayDate, status: nextStatus, estado: nextStatus };
        }
        return day;
      })
    );
  };

  // Actualiza el horario de inicio/fin de un día específico
  const updateDaySchedule = (date, startTime, endTime) => {
    setWorkingDays((prev) =>
      prev.map((day) => {
        const dayDate = day.date || day.fecha;
        if (dayDate === date) {
          return { ...day, date: dayDate, fecha: dayDate, startTime, horarioInicio: startTime, endTime, horarioFin: endTime };
        }
        return day;
      })
    );
  };



  // --- FASE 4: APPOINTMENTS, STRIKES & FINES ---

  // CUU1.2: Register new appointment
  const addAppointment = (newAppointment) => {
    const clientId = newAppointment.clientId ?? newAppointment.clienteId;
    const hasActiveAppointment = appointments.some(
      (a) =>
        String(a.clientId || a.clienteId) === String(clientId) &&
        (a.status === 'Solicitado' || a.estado === 'Solicitado')
    );

    if (hasActiveAppointment) {
      throw new Error('Ya tenés un turno activo agendado. Tenés que asistir o cancelarlo antes de solicitar otro.');
    }

    const appointment = {
      ...newAppointment,
      id: 't_' + Date.now(),
      clientId: clientId,
      clienteId: clientId,
      clientName: newAppointment.clientName || newAppointment.clienteNombre,
      clienteNombre: newAppointment.clientName || newAppointment.clienteNombre,
      clientEmail: newAppointment.clientEmail || newAppointment.clienteEmail,
      clienteEmail: newAppointment.clientEmail || newAppointment.clienteEmail,
      clientPhone: newAppointment.clientPhone || newAppointment.clienteTelefono,
      clienteTelefono: newAppointment.clientPhone || newAppointment.clienteTelefono,
      employeeId: newAppointment.employeeId || newAppointment.empleadoId,
      empleadoId: newAppointment.employeeId || newAppointment.empleadoId,
      employeeName: newAppointment.employeeName || newAppointment.empleadoNombre,
      empleadoNombre: newAppointment.employeeName || newAppointment.empleadoNombre,
      serviceId: newAppointment.serviceId || newAppointment.servicioId,
      servicioId: newAppointment.serviceId || newAppointment.servicioId,
      serviceName: newAppointment.serviceName || newAppointment.servicioNombre,
      servicioNombre: newAppointment.serviceName || newAppointment.servicioNombre,
      servicePrice: newAppointment.servicePrice ?? newAppointment.servicioPrecio,
      servicioPrecio: newAppointment.servicePrice ?? newAppointment.servicioPrecio,
      serviceDuration: newAppointment.serviceDuration ?? newAppointment.servicioDuracion,
      servicioDuracion: newAppointment.serviceDuration ?? newAppointment.servicioDuracion,
      date: newAppointment.date || newAppointment.fecha,
      fecha: newAppointment.date || newAppointment.fecha,
      time: newAppointment.time || newAppointment.hora,
      hora: newAppointment.time || newAppointment.hora,
      status: 'Solicitado',
      estado: 'Solicitado',
      cancelledBy: null,
      canceladoPor: null,
      cancellationReason: null,
      motivoCancelacion: null,
      createdAt: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(),
    };

    setAppointments((prev) => [appointment, ...prev]);
    return appointment;
  };

  // CUU1.5: Cancel client appointment (24h rule)
  const cancelClientAppointment = (appointmentId, reason = 'Cancelado por el cliente') => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    const appointmentDateStr = appointment.date || appointment.fecha;
    const appointmentTimeStr = appointment.time || appointment.hora || '10:00';
    const appointmentDateTime = new Date(`${appointmentDateStr}T${appointmentTimeStr}:00`);
    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLessThan24Hours = diffHours < 24;

    const formattedReason = isLessThan24Hours
      ? `${reason} (Con menos de 24 hs de anticipación - penalizado con +1 strike)`
      : reason;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'Cancelado',
              estado: 'Cancelado',
              cancelledBy: 'cliente',
              canceladoPor: 'cliente',
              cancellationReason: formattedReason,
              motivoCancelacion: formattedReason,
            }
          : a
      )
    );

    if (isLessThan24Hours) {
      addStrike(
        appointment.clientId || appointment.clienteId,
        'Cancelación de turno con menos de 24 horas de anticipación'
      );
    }

    return { isLessThan24Hours, esConMenosDe24Hs: isLessThan24Hours };
  };

  // CUU1.3 and CUU1.6: Update appointment status (attended, absent, cancelled)
  const updateAppointmentStatus = (appointmentId, newStatus, reason = '') => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: newStatus,
              estado: newStatus,
              cancelledBy: newStatus === 'Cancelado' ? 'local' : a.cancelledBy,
              canceladoPor: newStatus === 'Cancelado' ? 'local' : a.canceladoPor,
              cancellationReason: reason || a.cancellationReason,
              motivoCancelacion: reason || a.motivoCancelacion,
            }
          : a
      )
    );

    if (newStatus === 'No-Asistido') {
      addStrike(
        appointment.clientId || appointment.clienteId,
        `Inasistencia al turno del día ${appointment.date || appointment.fecha}`
      );
    }
  };

  // Add strike and generate fine on 3rd strike
  const addStrike = (clientId, reason = 'Inasistencia o cancelación tardía') => {
    setClients((prevClients) =>
      prevClients.map((client) => {
        if (String(client.id) === String(clientId)) {
          const nextStrikes = (client.strikes || 0) + 1;
          const isFined = nextStrikes >= 3;
          const currentStatus = client.status || client.estado;
          const nextStatus = isFined ? 'Multado' : currentStatus;
          const clientName = client.name || client.nombre;

          if (isFined) {
            const newFine = {
              id: 'm_' + Date.now(),
              clientId: client.id,
              clienteId: client.id,
              clientName: clientName,
              clienteNombre: clientName,
              clientEmail: client.email,
              clienteEmail: client.email,
              amount: 3000,
              monto: 3000,
              reason: reason || 'Acumulación de 3 strikes',
              motivo: reason || 'Acumulación de 3 strikes',
              status: 'Pendiente',
              estado: 'Pendiente',
              issueDate: new Date().toISOString().split('T')[0],
              fechaEmision: new Date().toISOString().split('T')[0],
              paymentDate: null,
              fechaPago: null,
              paymentMethod: null,
              metodoPago: null,
            };
            setFines((prevFines) => [newFine, ...prevFines]);
          }

          if (user && String(user.id) === String(client.id)) {
            updateUserState({ strikes: nextStrikes, estado: nextStatus });
          }

          return { ...client, strikes: nextStrikes, status: nextStatus, estado: nextStatus };
        }
        return client;
      })
    );
  };

  // CUU4.1: Pay fine (Mercado Pago simulation)
  const payFine = (fineId, clientId) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setFines((prev) =>
      prev.map((f) =>
        f.id === fineId
          ? {
              ...f,
              status: 'Pagada',
              estado: 'Pagada',
              paymentDate: todayStr,
              fechaPago: todayStr,
              paymentMethod: 'Mercado Pago',
              metodoPago: 'Mercado Pago',
            }
          : f
      )
    );

    setClients((prev) =>
      prev.map((client) => {
        if (String(client.id) === String(clientId)) {
          if (user && String(user.id) === String(client.id)) {
            updateUserState({ strikes: 0, estado: 'Activo' });
          }
          return { ...client, strikes: 0, status: 'Activo', estado: 'Activo' };
        }
        return client;
      })
    );
  };

  return (
    <DataContext.Provider
      value={{
        // Servicios
        services,
        addService,
        updateService,
        toggleServiceStatus,
        // Empleados
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        // Clientes
        clients,
        toggleClientBlock,
        // Días de trabajo / Calendario (Fase 3)
        workingDays,
        toggleDayStatus,
        updateDaySchedule,
        // Appointments & Fines (English API)
        appointments,
        addAppointment,
        cancelClientAppointment,
        updateAppointmentStatus,
        addStrike,
        fines,
        payFine,
        // Temporary compatibility aliases for previous components
        diasTrabajo: workingDays,
        turnos: appointments,
        addTurno: addAppointment,
        cancelarTurnoCliente: cancelClientAppointment,
        cambiarEstadoTurno: updateAppointmentStatus,
        sumarStrike: addStrike,
        multas: fines,
        pagarMulta: payFine,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser utilizado dentro de un DataProvider');
  }
  return context;
};
