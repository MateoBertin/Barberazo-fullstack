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
          dayOfWeek: dayOfWeek,
          status: 'Habilitado', // 'Habilitado' | 'Deshabilitado' (Máquina de estados workingDay)
          startTime: '08:00',
          endTime: '20:00',
        });
      }
    }
  }
  return days;
};

// Normaliza días guardados en localStorage (migra formato viejo al canónico en inglés)
// Regla de negocio: turnos de 1 hora, el horario del día se recorta a horas en punto (xx:00)
const normalizeWorkingDay = (day) => {
  const date = day.date || day.fecha;
  const dayOfWeek = day.dayOfWeek || day.diaSemana;
  const status = day.status || day.estado || 'Habilitado';
  const snapToHour = (time, fallback) => {
    if (typeof time !== 'string' || !time.includes(':')) return fallback;
    return `${time.split(':')[0].padStart(2, '0')}:00`;
  };
  const startTime = snapToHour(day.startTime || day.horarioInicio, '08:00');
  const endTime = snapToHour(day.endTime || day.horarioFin, '20:00');
  return {
    id: day.id || `wd_${date}`,
    date,
    dayOfWeek,
    status,
    startTime,
    endTime,
  };
};

// Servicios iniciales predeterminados (CUU7.1, CUU7.2)
export const INITIAL_SERVICES = [
  {
    id: 's1',
    name: 'Corte Tradicional',
    durationMinutes: 60,
    price: 4500,
    description: 'Corte de cabello clásico o moderno con asesoramiento de estilo y acabado.',
    status: 'Habilitado', // 'Habilitado' | 'Deshabilitado' (Máquina de estados de Servicios)
  },
  {
    id: 's2',
    name: 'Arreglo de Barba',
    durationMinutes: 60,
    price: 3000,
    description: 'Diseño, perfilado, rebajado de barba y toalla caliente.',
    status: 'Habilitado',
  },
  {
    id: 's3',
    name: 'Combo Corte + Barba',
    durationMinutes: 60,
    price: 6500,
    description: 'Servicio completo de corte de cabello y arreglo de barba profesional.',
    status: 'Habilitado',
  },
  {
    id: 's4',
    name: 'Tintura / Coloración',
    durationMinutes: 60,
    price: 8500,
    description: 'Aplicación de tintura, mechas o camuflaje de canas.',
    status: 'Habilitado',
  },
  {
    id: 's5',
    name: 'Perfilado de Cejas',
    durationMinutes: 60,
    price: 2000,
    description: 'Depilación y diseño de cejas con navaja/pinza.',
    status: 'Habilitado',
  },
];

// Normaliza un servicio guardado (migra formato viejo al canónico en inglés)
// Regla de negocio: todos los servicios duran 1 hora (60 minutos)
const normalizeService = (service) => {
  const name = service.name || service.nombre;
  const price = service.price ?? service.precio ?? 0;
  const description = service.description ?? service.descripcion ?? '';
  const status = service.status || service.estado || 'Habilitado';
  return {
    id: service.id,
    name,
    durationMinutes: 60,
    price,
    description,
    status,
  };
};

// Empleados iniciales (CUU10.1, CUU10.2, CUU10.3, CUU6.3)
export const INITIAL_EMPLOYEES = [
  {
    id: 'e1',
    name: 'Nicolas Rodrigo Gutierrez Fernandez',
    email: 'empleado@barberazo.com',
    phone: '341-5554321',
    specialties: ['Corte Tradicional', 'Arreglo de Barba', 'Combo Corte + Barba'],
    schedule: {
      enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningShift: { startTime: '08:00', endTime: '12:00' },
      afternoonShift: { startTime: '14:00', endTime: '20:00' },
    },
    status: 'Activo',
  },
  {
    id: 'e2',
    name: 'Mateo Bertín',
    email: 'mateo@barberazo.com',
    phone: '341-5556789',
    specialties: ['Corte Tradicional', 'Tintura / Coloración', 'Perfilado de Cejas'],
    schedule: {
      enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningShift: { startTime: '08:00', endTime: '12:00' },
      afternoonShift: { startTime: '14:00', endTime: '20:00' },
    },
    status: 'Activo',
  },
];

// Normaliza un empleado guardado (migra formato viejo al canónico en inglés)
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
    email: employee.email,
    phone,
    specialties,
    schedule: {
      enabledDays,
      morningShift: { startTime: morningStart, endTime: morningEnd },
      afternoonShift: { startTime: afternoonStart, endTime: afternoonEnd },
    },
    status,
  };
};

// Clientes registrados en el sistema (CUU5.1, CUU5.2)
export const INITIAL_CLIENTS = [
  {
    id: 'c1',
    name: 'Gerónimo Benavides',
    email: 'cliente@barberazo.com',
    phone: '341-5551234',
    status: 'Activo', // 'Activo' | 'Bloqueado' | 'Multado' (Máquina de estados de Clientes)
    strikes: 0,
    registrationDate: '2026-05-15',
  },
  {
    id: 'c2',
    name: 'Lucas Multini Martino',
    email: 'multado@barberazo.com',
    phone: '341-5559999',
    status: 'Multado',
    strikes: 3,
    registrationDate: '2026-06-01',
  },
  {
    id: 'c3',
    name: 'Esteban Bloqueado',
    email: 'esteban@barberazo.com',
    phone: '341-5558888',
    status: 'Bloqueado',
    strikes: 1,
    registrationDate: '2026-04-10',
  },
];

// Normaliza un cliente guardado (migra formato viejo al canónico en inglés)
const normalizeClient = (client) => {
  const name = client.name || client.nombre;
  const phone = client.phone || client.telefono || '';
  const status = client.status || client.estado || 'Activo';
  const registrationDate = client.registrationDate || client.fechaRegistro || '2026-05-01';
  return {
    id: client.id,
    name,
    email: client.email,
    phone,
    status,
    strikes: client.strikes || 0,
    registrationDate,
  };
};

// Appointments iniciales de prueba (CUU1.2, CUU1.3, CUU1.5, CUU1.6)
export const INITIAL_APPOINTMENTS = [
  {
    id: 't_1',
    clientId: 4,
    clientName: 'Gerónimo Benavides',
    clientEmail: 'cliente@barberazo.com',
    clientPhone: '341-5551234',
    employeeId: 'e1',
    employeeName: 'Nicolas Rodrigo Gutierrez Fernandez',
    serviceId: 's1',
    serviceName: 'Corte Tradicional',
    servicePrice: 4500,
    serviceDuration: 60,
    date: '2026-09-30',
    time: '11:00',
    status: 'Solicitado',
    cancelledBy: null,
    cancellationReason: null,
    createdAt: '2026-09-28T14:30:00.000Z',
  },
  {
    id: 't_2',
    clientId: 4,
    clientName: 'Gerónimo Benavides',
    clientEmail: 'cliente@barberazo.com',
    clientPhone: '341-5551234',
    employeeId: 'e2',
    employeeName: 'Mateo Bertín',
    serviceId: 's3',
    serviceName: 'Combo Corte + Barba',
    servicePrice: 6500,
    serviceDuration: 60,
    date: '2026-09-22',
    time: '16:00',
    status: 'Asistido',
    cancelledBy: null,
    cancellationReason: null,
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 't_3',
    clientId: 5,
    clientName: 'Lucas Multini Martino',
    clientEmail: 'multado@barberazo.com',
    clientPhone: '341-5559999',
    employeeId: 'e1',
    employeeName: 'Nicolas Rodrigo Gutierrez Fernandez',
    serviceId: 's2',
    serviceName: 'Arreglo de Barba',
    servicePrice: 3000,
    serviceDuration: 60,
    date: '2026-09-25',
    time: '17:00',
    status: 'No-Asistido',
    cancelledBy: null,
    cancellationReason: 'Inasistencia sin previo aviso',
    createdAt: '2026-09-23T12:00:00.000Z',
  },
];

// Normaliza un appointment guardado (migra formato viejo al canónico en inglés)
// Regla de negocio: todos los turnos duran 1 hora (60 minutos)
const normalizeAppointment = (appointment) => {
  const date = appointment.date || appointment.fecha;
  const time = appointment.time || appointment.hora;
  const status = appointment.status || appointment.estado || 'Solicitado';
  return {
    id: appointment.id,
    clientId: appointment.clientId ?? appointment.clienteId,
    clientName: appointment.clientName || appointment.clienteNombre,
    clientEmail: appointment.clientEmail || appointment.clienteEmail,
    clientPhone: appointment.clientPhone || appointment.clienteTelefono,
    employeeId: appointment.employeeId || appointment.empleadoId,
    employeeName: appointment.employeeName || appointment.empleadoNombre,
    serviceId: appointment.serviceId || appointment.servicioId,
    serviceName: appointment.serviceName || appointment.servicioNombre,
    servicePrice: appointment.servicePrice ?? appointment.servicioPrecio,
    serviceDuration: 60,
    date,
    time,
    status,
    cancelledBy: appointment.cancelledBy ?? appointment.canceladoPor ?? null,
    cancellationReason: appointment.cancellationReason ?? appointment.motivoCancelacion ?? null,
    createdAt: appointment.createdAt || appointment.fechaCreacion,
  };
};

// Fines iniciales de prueba (CUU4.1)
export const INITIAL_FINES = [
  {
    id: 'm_1',
    clientId: 5,
    clientName: 'Lucas Multini Martino',
    clientEmail: 'multado@barberazo.com',
    amount: 3000,
    reason: 'Acumulación de 3 strikes por inasistencias o cancelaciones tardías',
    status: 'Pendiente',
    issueDate: '2026-09-25',
    paymentDate: null,
    paymentMethod: null,
  },
];

// Normaliza una fine guardada (migra formato viejo al canónico en inglés)
const normalizeFine = (fine) => {
  const status = fine.status || fine.estado || 'Pendiente';
  const issueDate = fine.issueDate || fine.fechaEmision;
  return {
    id: fine.id,
    clientId: fine.clientId ?? fine.clienteId,
    clientName: fine.clientName || fine.clienteNombre,
    clientEmail: fine.clientEmail || fine.clienteEmail,
    amount: fine.amount ?? fine.monto,
    reason: fine.reason || fine.motivo,
    status,
    issueDate,
    paymentDate: fine.paymentDate ?? fine.fechaPago ?? null,
    paymentMethod: fine.paymentMethod ?? fine.metodoPago ?? null,
  };
};

// Reviews iniciales de prueba (CUU1.4, CUU8.1)
export const INITIAL_REVIEWS = [
  {
    id: 'r_1',
    appointmentId: 't_2',
    clientId: 4,
    clientName: 'Gerónimo Benavides',
    employeeId: 'e2',
    employeeName: 'Mateo Bertín',
    serviceName: 'Combo Corte + Barba',
    rating: 5,
    comment: 'Excelente atención y muy buen acabado. Volveré seguro.',
    date: '2026-09-22',
  },
];

// Normaliza una review guardada al canónico en inglés
const normalizeReview = (review) => {
  return {
    id: review.id,
    appointmentId: review.appointmentId,
    clientId: review.clientId,
    clientName: review.clientName,
    employeeId: review.employeeId,
    employeeName: review.employeeName,
    serviceName: review.serviceName,
    rating: review.rating,
    comment: review.comment || '',
    date: review.date,
  };
};

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
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed.map(normalizeAppointment);
    }
    return INITIAL_APPOINTMENTS;
  });

  // Fines: Sanciones por acumulación de 3 strikes (Fase 4)
  const [fines, setFines] = useState(() => {
    const saved = localStorage.getItem('barberazo_fines') || localStorage.getItem('barberazo_multas');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed.map(normalizeFine);
    }
    return INITIAL_FINES;
  });

  // Reviews: Calificaciones de turnos asistidos (Fase 5, CUU1.4)
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('barberazo_reviews');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed.map(normalizeReview);
    }
    return INITIAL_REVIEWS;
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
  }, [workingDays]);

  useEffect(() => {
    localStorage.setItem('barberazo_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('barberazo_fines', JSON.stringify(fines));
  }, [fines]);

  useEffect(() => {
    localStorage.setItem('barberazo_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // --- CRUD SERVICIOS (CUU7.1, CUU7.2) ---
  const addService = (newService) => {
    const service = normalizeService({
      ...newService,
      id: 's_' + Date.now(),
      status: 'Habilitado',
    });
    setServices((prev) => [...prev, service]);
  };

  const updateService = (id, updatedData) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? normalizeService({ ...s, ...updatedData, id }) : s))
    );
  };

  const toggleServiceStatus = (id) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
          return { ...s, status: nextStatus };
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

  // --- EDICIÓN Y ELIMINACIÓN DE CLIENTES (CUU9.1, CUU9.2) ---
  const updateClient = (id, updatedData) => {
    setClients((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? normalizeClient({ ...c, ...updatedData, id: c.id }) : c))
    );
  };

  const removeClient = (id) => {
    setClients((prev) => prev.filter((c) => String(c.id) !== String(id)));
  };

  // --- GESTIÓN DE CLIENTES Y BLOQUEOS (CUU5.1, CUU5.2) ---
  const toggleClientBlock = (id) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === id) {
          // Transición de estados de Clientes
          const nextStatus = client.status === 'Bloqueado' ? 'Activo' : 'Bloqueado';
          return { ...client, status: nextStatus };
        }
        return client;
      })
    );
  };

  // --- GESTIÓN DE DÍAS LABORALES / CALENDARIO (CUU6.1, CUU6.2) ---

  // CUU6.1 Habilitar Fecha / CUU6.2 Deshabilitar Fecha
  // Alterna el estado de un workingDay entre 'Habilitado' y 'Deshabilitado'
  const toggleDayStatus = (date) => {
    setWorkingDays((prev) =>
      prev.map((day) => {
        if (day.date === date) {
          const nextStatus = day.status === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
          return { ...day, status: nextStatus };
        }
        return day;
      })
    );
  };

  // Actualiza el horario de inicio/fin de un día específico
  const updateDaySchedule = (date, startTime, endTime) => {
    setWorkingDays((prev) =>
      prev.map((day) =>
        day.date === date ? { ...day, startTime, endTime } : day
      )
    );
  };



  // --- FASE 4: APPOINTMENTS, STRIKES & FINES ---

  // CUU1.2: Register new appointment
  const addAppointment = (newAppointment) => {
    const hasActiveAppointment = appointments.some(
      (a) =>
        String(a.clientId) === String(newAppointment.clientId) &&
        a.status === 'Solicitado'
    );

    if (hasActiveAppointment) {
      throw new Error('Ya tenés un turno activo agendado. Tenés que asistir o cancelarlo antes de solicitar otro.');
    }

    const appointment = {
      id: 't_' + Date.now(),
      clientId: newAppointment.clientId,
      clientName: newAppointment.clientName,
      clientEmail: newAppointment.clientEmail,
      clientPhone: newAppointment.clientPhone,
      employeeId: newAppointment.employeeId,
      employeeName: newAppointment.employeeName,
      serviceId: newAppointment.serviceId,
      serviceName: newAppointment.serviceName,
      servicePrice: newAppointment.servicePrice,
      serviceDuration: 60, // Regla de negocio: todos los turnos duran 1 hora
      date: newAppointment.date,
      time: newAppointment.time,
      status: 'Solicitado',
      cancelledBy: null,
      cancellationReason: null,
      createdAt: new Date().toISOString(),
    };

    // Si el cliente no tiene registro en clients (ej. se registró por Auth y
    // nunca reservó), se crea para que strikes y multas tengan dónde sumarse
    const clientExists = clients.some(
      (c) => String(c.id) === String(appointment.clientId) || c.email === appointment.clientEmail
    );
    if (!clientExists) {
      const newClient = normalizeClient({
        id: appointment.clientId,
        name: appointment.clientName,
        email: appointment.clientEmail,
        phone: appointment.clientPhone,
        status: 'Activo',
        strikes: 0,
        registrationDate: new Date().toISOString().split('T')[0],
      });
      setClients((prev) => [...prev, newClient]);
    }

    setAppointments((prev) => [appointment, ...prev]);
    return appointment;
  };

  // CUU1.5: Cancel client appointment (24h rule)
  const cancelClientAppointment = (appointmentId, reason = 'Cancelado por el cliente') => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time || '10:00'}:00`);
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
              cancelledBy: 'cliente',
              cancellationReason: formattedReason,
            }
          : a
      )
    );

    if (isLessThan24Hours) {
      addStrike(
        appointment.clientId,
        'Cancelación de turno con menos de 24 horas de anticipación',
        appointment.clientEmail
      );
    }

    return { isLessThan24Hours };
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
              cancelledBy: newStatus === 'Cancelado' ? 'local' : a.cancelledBy,
              cancellationReason: reason || a.cancellationReason,
            }
          : a
      )
    );

    if (newStatus === 'No-Asistido') {
      addStrike(
        appointment.clientId,
        `Inasistencia al turno del día ${appointment.date}`,
        appointment.clientEmail
      );
    }
  };

  // Add strike and generate fine on 3rd strike
  // El cliente se busca por id y, como respaldo, por email: los turnos guardan
  // el id de Auth (numérico) mientras que los clientes usan ids propios ('c1').
  // Los cálculos se hacen fuera de los updaters: en StrictMode React puede
  // invocarlos dos veces y los efectos (crear multa) se duplicarían.
  const addStrike = (clientId, reason = 'Inasistencia o cancelación tardía', clientEmail = null) => {
    const client = clients.find(
      (c) => String(c.id) === String(clientId) || (clientEmail && c.email === clientEmail)
    );
    if (!client) return;

    const nextStrikes = (client.strikes || 0) + 1;
    const isFined = nextStrikes >= 3;
    const nextStatus = isFined ? 'Multado' : client.status;

    if (isFined) {
      const newFine = {
        id: 'm_' + Date.now(),
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        amount: 3000,
        reason: reason || 'Acumulación de 3 strikes',
        status: 'Pendiente',
        issueDate: new Date().toISOString().split('T')[0],
        paymentDate: null,
        paymentMethod: null,
      };
      setFines((prevFines) => {
        if (prevFines.some((f) => f.clientId === client.id && f.status === 'Pendiente' && f.reason === newFine.reason)) {
          return prevFines;
        }
        return [newFine, ...prevFines];
      });
    }

    setClients((prevClients) =>
      prevClients.map((c) => {
        const matchesId = String(c.id) === String(client.id);
        const matchesEmail = client.email && c.email === client.email;
        return matchesId || matchesEmail
          ? { ...c, strikes: nextStrikes, status: nextStatus }
          : c;
      })
    );

    if (user && (String(user.id) === String(client.id) || user.email === client.email)) {
      updateUserState({ strikes: nextStrikes, estado: nextStatus });
    }
  };

  // CUU4.1: Pay fine (Mercado Pago simulation)
  const payFine = (fineId, clientId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const paidFine = fines.find((f) => f.id === fineId);

    setFines((prev) =>
      prev.map((fine) =>
        fine.id === fineId
          ? {
              ...fine,
              status: 'Pagada',
              paymentDate: todayStr,
              paymentMethod: 'Mercado Pago',
            }
          : fine
      )
    );

    setClients((prev) =>
      prev.map((client) => {
        const matchesId = String(client.id) === String(clientId);
        const matchesFine = paidFine && String(client.id) === String(paidFine.clientId);
        const matchesEmail = paidFine && client.email === paidFine.clientEmail;
        if (matchesId || matchesFine || matchesEmail) {
          if (user && String(user.id) === String(client.id)) {
            updateUserState({ strikes: 0, estado: 'Activo' });
          }
          return { ...client, strikes: 0, status: 'Activo' };
        }
        return client;
      })
    );
  };

  // --- FASE 5: REVIEWS (CUU1.4) ---
  // CUU1.4: Register review for an attended appointment (1 review per appointment)
  const addReview = (newReview) => {
    const alreadyReviewed = reviews.some((r) => r.appointmentId === newReview.appointmentId);
    if (alreadyReviewed) {
      throw new Error('Este turno ya fue calificado.');
    }
    if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
      throw new Error('La calificación debe ser de 1 a 5 estrellas.');
    }

    const review = normalizeReview({
      ...newReview,
      id: 'r_' + Date.now(),
      comment: newReview.comment || '',
      date: new Date().toISOString().split('T')[0],
    });

    setReviews((prev) => [review, ...prev]);
    return review;
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
        updateClient,
        removeClient,
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
        // Reviews (Fase 5)
        reviews,
        addReview,
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
