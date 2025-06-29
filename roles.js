// 1. CREAR ROLES
db.createRole({
    role: "administrador_campus",
    privileges: [
      {
        resource: { db: "campus_parking", collection: "" },
        actions: ["find", "insert", "update", "remove", "createIndex", "dropIndex", "createCollection", "dropCollection"],
      },
      {
        resource: { db: "campus_parking", collection: "usuarios" },
        actions: [
          "find",
          "insert",
          "update",
          "remove",
          "changeOwnPassword",
          "changeAnyPassword",
          "createUser",
          "dropUser",
          "grantRole",
          "revokeRole",
        ],
      },
      {
        resource: { db: "campus_parking", collection: "" },
        actions: ["collStats", "dbStats", "indexStats"],
      },
    ],
    roles: [],
  })
  
  db.createRole({
    role: "empleado_sede_campus",
    privileges: [
      {
        resource: { db: "campus_parking", collection: "usuarios" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "vehiculos" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "parqueos" },
        actions: ["find", "insert", "update"],
      },
      {
        resource: { db: "campus_parking", collection: "sedes" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "zonas" },
        actions: ["find", "update"],
      },
    ],
    roles: [],
  })
  
  db.createRole({
    role: "cliente_campus",
    privileges: [
      {
        resource: { db: "campus_parking", collection: "usuarios" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "vehiculos" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "parqueos" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "sedes" },
        actions: ["find"],
      },
      {
        resource: { db: "campus_parking", collection: "zonas" },
        actions: ["find"],
      },
    ],
    roles: [],
  })
  
  // 2. CREAR USUARIOS
  db.createUser({
    user: "admin_ana",
    pwd: "AdminSecure123!",
    roles: [{ role: "administrador_campus", db: "campus_parking" }],
    customData: {
      nombre: "Ana María González",
      cedula: "12345678",
      email: "admin@campusparking.com",
      tipo_usuario: "administrador",
    },
  })
  
  db.createUser({
    user: "empleado_carlos",
    pwd: "EmpleadoSecure123!",
    roles: [{ role: "empleado_sede_campus", db: "campus_parking" }],
    customData: {
      nombre: "Carlos Rodríguez",
      cedula: "23456789",
      email: "carlos.bogota@campusparking.com",
      sede_asignada: ObjectId("650000000000000000000001"),
      tipo_usuario: "empleado_sede",
    },
  })
  
  db.createUser({
    user: "cliente_juan",
    pwd: "ClienteSecure123!",
    roles: [{ role: "cliente_campus", db: "campus_parking" }],
    customData: {
      nombre: "Juan Pérez",
      cedula: "80000000",
      email: "cliente1@email.com",
      tipo_usuario: "cliente",
    },
  })
  