import React, { createContext, useContext, useState, useEffect } from 'react';

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
      const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, 2=Mar ... 6=Sáb
      // Solo Martes(2) a Sábado(6) — Domingos y Lunes son no laborables
      if (dayOfWeek !== 0 && dayOfWeek !== 1) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          id: `dt_${dateStr}`,
          fecha: dateStr,
          diaSemana: DAY_NAMES_ES[dayOfWeek],
          estado: 'Habilitado', // 'Habilitado' | 'Deshabilitado' (Máquina de estados diaTrabajo)
          horarioInicio: '08:00',
          horarioFin: '20:00',
        });
      }
    }
  }
  return days;
};

// Servicios iniciales predeterminados (CUU7.1, CUU7.2)
export const INITIAL_SERVICES = [
  {
    id: 's1',
    nombre: 'Corte Tradicional',
    duracionMinutos: 30,
    precio: 4500,
    descripcion: 'Corte de cabello clásico o moderno con asesoramiento de estilo y acabado.',
    estado: 'Habilitado', // 'Habilitado' | 'Deshabilitado' (Máquina de estados de Servicios)
  },
  {
    id: 's2',
    nombre: 'Arreglo de Barba',
    duracionMinutos: 20,
    precio: 3000,
    descripcion: 'Diseño, perfilado, rebajado de barba y toalla caliente.',
    estado: 'Habilitado',
  },
  {
    id: 's3',
    nombre: 'Combo Corte + Barba',
    duracionMinutos: 45,
    precio: 6500,
    descripcion: 'Servicio completo de corte de cabello y arreglo de barba profesional.',
    estado: 'Habilitado',
  },
  {
    id: 's4',
    nombre: 'Tintura / Coloración',
    duracionMinutos: 60,
    precio: 8500,
    descripcion: 'Aplicación de tintura, mechas o camuflaje de canas.',
    estado: 'Habilitado',
  },
  {
    id: 's5',
    nombre: 'Perfilado de Cejas',
    duracionMinutos: 15,
    precio: 2000,
    descripcion: 'Depilación y diseño de cejas con navaja/pinza.',
    estado: 'Habilitado',
  },
];

// Empleados iniciales (CUU10.1, CUU10.2, CUU10.3, CUU6.3)
export const INITIAL_EMPLOYEES = [
  {
    id: 'e1',
    nombre: 'Nicolas Rodrigo Gutierrez Fernandez',
    email: 'empleado@barberazo.com',
    telefono: '341-5554321',
    especialidades: ['Corte Tradicional', 'Arreglo de Barba', 'Combo Corte + Barba'],
    horarios: {
      diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      turnoManana: { inicio: '08:00', fin: '12:00' },
      turnoTarde: { inicio: '14:00', fin: '20:00' },
    },
    estado: 'Activo',
  },
  {
    id: 'e2',
    nombre: 'Mateo Bertín',
    email: 'mateo@barberazo.com',
    telefono: '341-5556789',
    especialidades: ['Corte Tradicional', 'Tintura / Coloración', 'Perfilado de Cejas'],
    horarios: {
      diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      turnoManana: { inicio: '08:00', fin: '12:00' },
      turnoTarde: { inicio: '14:00', fin: '20:00' },
    },
    estado: 'Activo',
  },
];

// Clientes registrados en el sistema (CUU5.1, CUU5.2)
export const INITIAL_CLIENTS = [
  {
    id: 'c1',
    nombre: 'Gerónimo Benavides',
    email: 'cliente@barberazo.com',
    telefono: '341-5551234',
    estado: 'Activo', // 'Activo' | 'Bloqueado' | 'Multado' (Máquina de estados de Clientes)
    strikes: 0,
    fechaRegistro: '2026-05-15',
  },
  {
    id: 'c2',
    nombre: 'Lucas Multini Martino',
    email: 'multado@barberazo.com',
    telefono: '341-5559999',
    estado: 'Multado',
    strikes: 3,
    fechaRegistro: '2026-06-01',
  },
  {
    id: 'c3',
    nombre: 'Esteban Bloqueado',
    email: 'esteban@barberazo.com',
    telefono: '341-5558888',
    estado: 'Bloqueado',
    strikes: 1,
    fechaRegistro: '2026-04-10',
  },
];

export const DataProvider = ({ children }) => {
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('barberazo_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('barberazo_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('barberazo_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  // diasTrabajo: Todos los días laborales Martes-Sábado de los próximos 3 meses
  const [diasTrabajo, setDiasTrabajo] = useState(() => {
    const saved = localStorage.getItem('barberazo_diasTrabajo');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Si los datos guardados son de una sesión muy antigua, regenerar
      if (parsed.length > 0) return parsed;
    }
    return generateWorkingDays();
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
    localStorage.setItem('barberazo_diasTrabajo', JSON.stringify(diasTrabajo));
  }, [diasTrabajo]);

  // --- CRUD SERVICIOS (CUU7.1, CUU7.2) ---
  const addService = (newService) => {
    const s = {
      ...newService,
      id: 's_' + Date.now(),
      estado: 'Habilitado',
    };
    setServices((prev) => [...prev, s]);
  };

  const updateService = (id, updatedData) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
    );
  };

  const toggleServiceStatus = (id) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = s.estado === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
          return { ...s, estado: nextState };
        }
        return s;
      })
    );
  };

  // --- CRUD EMPLEADOS (CUU10.1, CUU10.2, CUU10.3, CUU6.3) ---
  const addEmployee = (newEmployee) => {
    const e = {
      ...newEmployee,
      id: 'e_' + Date.now(),
      estado: 'Activo',
      horarios: newEmployee.horarios || {
        diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        turnoManana: { inicio: '08:00', fin: '12:00' },
        turnoTarde: { inicio: '14:00', fin: '20:00' },
      },
    };
    setEmployees((prev) => [...prev, e]);
  };

  const updateEmployee = (id, updatedData) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e))
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
          const nextState = c.estado === 'Bloqueado' ? 'Activo' : 'Bloqueado';
          return { ...c, estado: nextState };
        }
        return c;
      })
    );
  };

  // --- GESTIÓN DE DÍAS LABORALES / CALENDARIO (CUU6.1, CUU6.2) ---

  // CUU6.1 Habilitar Fecha / CUU6.2 Deshabilitar Fecha
  // Alterna el estado de un diaTrabajo entre 'Habilitado' y 'Deshabilitado'
  const toggleDayStatus = (fecha) => {
    setDiasTrabajo((prev) =>
      prev.map((dt) => {
        if (dt.fecha === fecha) {
          const nextState = dt.estado === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
          return { ...dt, estado: nextState };
        }
        return dt;
      })
    );
  };

  // Actualiza el horario de inicio/fin de un día específico
  const updateDaySchedule = (fecha, horarioInicio, horarioFin) => {
    setDiasTrabajo((prev) =>
      prev.map((dt) =>
        dt.fecha === fecha ? { ...dt, horarioInicio, horarioFin } : dt
      )
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
        diasTrabajo,
        toggleDayStatus,
        updateDaySchedule,
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
