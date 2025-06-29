
    // 1. COLECCIÓN USUARIOS
 db.createCollection("usuarios", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["cedula", "nombre", "email", "telefono", "rol", "estado", "fecha_registro"],
        properties: {
          cedula: {
            bsonType: "string",
            pattern: "^[0-9]{8,12}$",
            description: "Cédula debe ser numérica de 8-12 dígitos",
          },
          nombre: {
            bsonType: "string",
            minLength: 2,
            maxLength: 100,
            description: "Nombre completo del usuario",
          },
          email: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            description: "Email válido",
          },
          telefono: {
            bsonType: "string",
            pattern: "^[0-9+\\-\\s()]{10,15}$",
            description: "Teléfono válido",
          },
          rol: {
            enum: ["administrador", "empleado_sede", "cliente"],
            description: "Rol del usuario en el sistema",
          },
          sede_asignada: {
            bsonType: "objectId",
            description: "Sede asignada para empleados (opcional)",
          },
          direccion: {
            bsonType: "object",
            properties: {
              calle: { bsonType: "string" },
              ciudad: { bsonType: "string" },
              codigo_postal: { bsonType: "string" },
            },
          },
          estado: {
            enum: ["activo", "inactivo", "suspendido"],
            description: "Estado del usuario",
          },
          fecha_registro: {
            bsonType: "date",
            description: "Fecha de registro del usuario",
          },
          ultimo_acceso: {
            bsonType: "date",
            description: "Último acceso al sistema",
          },
        },
      },
    },
  })

// Índices para usuarios
db.usuarios.createIndex({ cedula: 1 })
db.usuarios.createIndex({ rol: 1, estado: 1 })

// 2. COLECCIÓN SEDES
db.createCollection("sedes", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["nombre", "ciudad", "direccion", "telefono", "estado", "fecha_apertura"],
        properties: {
          nombre: {
            bsonType: "string",
            minLength: 3,
            maxLength: 100,
            description: "Nombre de la sede",
          },
          ciudad: {
            bsonType: "string",
            minLength: 2,
            maxLength: 50,
            description: "Ciudad donde se ubica la sede",
          },
          direccion: {
            bsonType: "object",
            required: ["calle", "numero", "barrio"],
            properties: {
              calle: { bsonType: "string" },
              numero: { bsonType: "string" },
              barrio: { bsonType: "string" },
              referencias: { bsonType: "string" },
            },
          },
          telefono: {
            bsonType: "string",
            pattern: "^[0-9+\\-\\s()]{10,15}$",
          },
          coordenadas: {
            bsonType: "object",
            properties: {
              latitud: { bsonType: "double" },
              longitud: { bsonType: "double" },
            },
          },
          horario_operacion: {
            bsonType: "object",
            properties: {
              apertura: { bsonType: "string", pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$" },
              cierre: { bsonType: "string", pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$" },
              dias_operacion: {
                bsonType: "array",
                items: {
                  enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                },
              },
            },
          },
          estado: {
            enum: ["activa", "inactiva", "mantenimiento"],
            description: "Estado operacional de la sede",
          },
          fecha_apertura: {
            bsonType: "date",
            description: "Fecha de apertura de la sede",
          },
        },
      },
    },
  })

  // Índices para sedes
db.sedes.createIndex({ ciudad: 1, estado: 1 })
 db.sedes.createIndex({ "coordenadas.latitud": 1, "coordenadas.longitud": 1 })

  // 3. COLECCIÓN ZONAS
db.createCollection("zonas", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [
          "sede_id",
          "nombre",
          "capacidad_maxima",
          "cupos_disponibles",
          "tipos_vehiculo_permitidos",
          "tarifa_por_hora",
          "estado",
        ],
        properties: {
          sede_id: {
            bsonType: "objectId",
            description: "ID de la sede a la que pertenece",
          },
          nombre: {
            bsonType: "string",
            minLength: 1,
            maxLength: 50,
            description: "Nombre identificador de la zona",
          },
          descripcion: {
            bsonType: "string",
            maxLength: 200,
            description: "Descripción de la zona",
          },
          capacidad_maxima: {
            bsonType: "int",
            minimum: 1,
            maximum: 1000,
            description: "Capacidad máxima de vehículos",
          },
          cupos_disponibles: {
            bsonType: "int",
            minimum: 0,
            description: "Cupos actualmente disponibles",
          },
          tipos_vehiculo_permitidos: {
            bsonType: "array",
            minItems: 1,
            items: {
              enum: ["carro", "moto", "bicicleta", "camion", "bus"],
            },
            description: "Tipos de vehículos permitidos en esta zona",
          },
          tarifa_por_hora: {
            bsonType: "object",
            required: ["carro", "moto"],
            properties: {
              carro: { bsonType: "double", minimum: 0 },
              moto: { bsonType: "double", minimum: 0 },
              bicicleta: { bsonType: "double", minimum: 0 },
              camion: { bsonType: "double", minimum: 0 },
              bus: { bsonType: "double", minimum: 0 },
            },
            description: "Tarifas por hora según tipo de vehículo",
          },
          caracteristicas: {
            bsonType: "array",
            items: {
              enum: ["techada", "vigilancia", "camaras", "iluminada", "acceso_discapacitados"],
            },
          },
          estado: {
            enum: ["activa", "inactiva", "mantenimiento", "llena"],
            description: "Estado actual de la zona",
          },
          fecha_creacion: {
            bsonType: "date",
            description: "Fecha de creación de la zona",
          },
        },
      },
    },
  })

  // Índices para zonas
   db.zonas.createIndex({ sede_id: 1, estado: 1 })
   db.zonas.createIndex({ tipos_vehiculo_permitidos: 1 })
  db.zonas.createIndex({ cupos_disponibles: 1 })
   db.zonas.createIndex({ sede_id: 1, cupos_disponibles: 1 })

  // 4. COLECCIÓN VEHÍCULOS
   db.createCollection("vehiculos", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["placa", "propietario_id", "tipo", "marca", "modelo", "color", "estado"],
        properties: {
          placa: {
            bsonType: "string",
            pattern: "^[A-Z0-9]{6,8}$",
            description: "Placa del vehículo en formato válido",
          },
          propietario_id: {
            bsonType: "objectId",
            description: "ID del usuario propietario",
          },
          tipo: {
            enum: ["carro", "moto", "bicicleta", "camion", "bus"],
            description: "Tipo de vehículo",
          },
          marca: {
            bsonType: "string",
            minLength: 2,
            maxLength: 30,
            description: "Marca del vehículo",
          },
          modelo: {
            bsonType: "string",
            minLength: 1,
            maxLength: 50,
            description: "Modelo del vehículo",
          },
          año: {
            bsonType: "int",
            minimum: 1900,
            maximum: 2030,
            description: "Año del vehículo",
          },
          color: {
            bsonType: "string",
            minLength: 3,
            maxLength: 20,
            description: "Color del vehículo",
          },
          numero_motor: {
            bsonType: "string",
            description: "Número de motor (opcional)",
          },
          numero_chasis: {
            bsonType: "string",
            description: "Número de chasis (opcional)",
          },
          estado: {
            enum: ["activo", "inactivo", "bloqueado"],
            description: "Estado del vehículo en el sistema",
          },
          fecha_registro: {
            bsonType: "date",
            description: "Fecha de registro del vehículo",
          },
        },
      },
    },
  })

  // Índices para vehículos
   db.vehiculos.createIndex({ placa: 1 }, { unique: true })
   db.vehiculos.createIndex({ propietario_id: 1 })
   db.vehiculos.createIndex({ tipo: 1, estado: 1 })

  // 5. COLECCIÓN PARQUEOS
   db.createCollection("parqueos", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["vehiculo_id", "sede_id", "zona_id", "fecha_entrada", "estado"],
        properties: {
          vehiculo_id: {
            bsonType: "objectId",
            description: "ID del vehículo parqueado",
          },
          sede_id: {
            bsonType: "objectId",
            description: "ID de la sede donde se parquea",
          },
          zona_id: {
            bsonType: "objectId",
            description: "ID de la zona específica",
          },
          empleado_entrada_id: {
            bsonType: "objectId",
            description: "ID del empleado que registró la entrada",
          },
          empleado_salida_id: {
            bsonType: "objectId",
            description: "ID del empleado que registró la salida",
          },
          fecha_entrada: {
            bsonType: "date",
            description: "Fecha y hora de entrada",
          },
          fecha_salida: {
            bsonType: "date",
            description: "Fecha y hora de salida (opcional si está activo)",
          },
          tiempo_total_minutos: {
            bsonType: "int",
            minimum: 0,
            description: "Tiempo total en minutos",
          },
          tarifa_aplicada: {
            bsonType: "double",
            minimum: 0,
            description: "Tarifa por hora aplicada",
          },
          costo_total: {
            bsonType: "double",
            minimum: 0,
            description: "Costo total calculado",
          },
          metodo_pago: {
            enum: ["efectivo", "tarjeta", "transferencia", "app_movil"],
            description: "Método de pago utilizado",
          },
          observaciones: {
            bsonType: "string",
            maxLength: 500,
            description: "Observaciones adicionales",
          },
          estado: {
            enum: ["activo", "finalizado", "cancelado"],
            description: "Estado del parqueo",
          },
        },
      },
    },
  })

  // Índices para parqueos
   db.parqueos.createIndex({ vehiculo_id: 1, fecha_entrada: -1 })
   db.parqueos.createIndex({ sede_id: 1, zona_id: 1, estado: 1 })
   db.parqueos.createIndex({ fecha_entrada: -1 })
   db.parqueos.createIndex({ estado: 1, fecha_entrada: -1 })
   db.parqueos.createIndex({ sede_id: 1, fecha_entrada: -1 })