// 1. Parqueos por sede en el último mes
db.parqueos.aggregate([
  {
    $match: {
      fecha_entrada: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
  },
  {
    $group: {
      _id: "$sede_id",
      total_parqueos: { $sum: 1 },
      ingresos_totales: { $sum: "$costo_total" },
    },
  },
  {
    $lookup: {
      from: "sedes",
      localField: "_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $project: {
      sede_nombre: { $arrayElemAt: ["$sede_info.nombre", 0] },
      ciudad: { $arrayElemAt: ["$sede_info.ciudad", 0] },
      total_parqueos: 1,
      ingresos_totales: 1,
    },
  },
  {
    $sort: { total_parqueos: -1 },
  },
])

// 2. Zonas más ocupadas por sede
db.parqueos.aggregate([
  {
    $group: {
      _id: {
        sede_id: "$sede_id",
        zona_id: "$zona_id",
      },
      total_usos: { $sum: 1 },
      tiempo_promedio_horas: {
        $avg: { $divide: ["$tiempo_total_minutos", 60] },
      },
    },
  },
  {
    $lookup: {
      from: "sedes",
      localField: "_id.sede_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $lookup: {
      from: "zonas",
      localField: "_id.zona_id",
      foreignField: "_id",
      as: "zona_info",
    },
  },
  {
    $project: {
      sede_nombre: { $arrayElemAt: ["$sede_info.nombre", 0] },
      zona_nombre: { $arrayElemAt: ["$zona_info.nombre", 0] },
      capacidad_maxima: { $arrayElemAt: ["$zona_info.capacidad_maxima", 0] },
      total_usos: 1,
      tiempo_promedio_horas: { $round: ["$tiempo_promedio_horas", 2] },
      porcentaje_ocupacion: {
        $multiply: [{ $divide: ["$total_usos", { $arrayElemAt: ["$zona_info.capacidad_maxima", 0] }] }, 100],
      },
    },
  },
  {
    $sort: { "_id.sede_id": 1, total_usos: -1 },
  },
])

// 3. Ingresos totales por sede
db.parqueos.aggregate([
  {
    $match: {
      estado: "finalizado",
      costo_total: { $gt: 0 },
    },
  },
  {
    $group: {
      _id: "$sede_id",
      ingreso_total: { $sum: "$costo_total" },
      total_parqueos_pagados: { $sum: 1 },
      ingreso_promedio: { $avg: "$costo_total" },
    },
  },
  {
    $lookup: {
      from: "sedes",
      localField: "_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $project: {
      sede_nombre: { $arrayElemAt: ["$sede_info.nombre", 0] },
      ciudad: { $arrayElemAt: ["$sede_info.ciudad", 0] },
      ingreso_total: 1,
      total_parqueos_pagados: 1,
      ingreso_promedio: { $round: ["$ingreso_promedio", 0] },
    },
  },
  {
    $sort: { ingreso_total: -1 },
  },
])

// 4. Cliente más frecuente
db.parqueos.aggregate([
  {
    $lookup: {
      from: "vehiculos",
      localField: "vehiculo_id",
      foreignField: "_id",
      as: "vehiculo_info",
    },
  },
  {
    $lookup: {
      from: "usuarios",
      localField: "vehiculo_info.propietario_id",
      foreignField: "_id",
      as: "cliente_info",
    },
  },
  {
    $group: {
      _id: { $arrayElemAt: ["$cliente_info._id", 0] },
      nombre_cliente: { $first: { $arrayElemAt: ["$cliente_info.nombre", 0] } },
      email_cliente: { $first: { $arrayElemAt: ["$cliente_info.email", 0] } },
      total_visitas: { $sum: 1 },
      gasto_total: { $sum: "$costo_total" },
      vehiculos_diferentes: { $addToSet: "$vehiculo_id" },
    },
  },
  {
    $project: {
      nombre_cliente: 1,
      email_cliente: 1,
      total_visitas: 1,
      gasto_total: 1,
      cantidad_vehiculos: { $size: "$vehiculos_diferentes" },
    },
  },
  {
    $sort: { total_visitas: -1 },
  },
  {
    $limit: 5,
  },
])

// 5. Tipo de vehículo más frecuente por sede
db.parqueos.aggregate([
  {
    $lookup: {
      from: "vehiculos",
      localField: "vehiculo_id",
      foreignField: "_id",
      as: "vehiculo_info",
    },
  },
  {
    $lookup: {
      from: "sedes",
      localField: "sede_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $group: {
      _id: {
        sede_id: "$sede_id",
        tipo_vehiculo: { $arrayElemAt: ["$vehiculo_info.tipo", 0] },
      },
      sede_nombre: { $first: { $arrayElemAt: ["$sede_info.nombre", 0] } },
      cantidad: { $sum: 1 },
    },
  },
  {
    $sort: { "_id.sede_id": 1, cantidad: -1 },
  },
  {
    $group: {
      _id: "$_id.sede_id",
      sede_nombre: { $first: "$sede_nombre" },
      tipos_vehiculos: {
        $push: {
          tipo: "$_id.tipo_vehiculo",
          cantidad: "$cantidad",
        },
      },
      tipo_mas_frecuente: { $first: "$_id.tipo_vehiculo" },
      cantidad_mas_frecuente: { $first: "$cantidad" },
    },
  },
])

// 6. Historial de parqueos de un cliente específico
db.usuarios.aggregate([
  {
    $match: { email: "cliente1@email.com" },
  },
  {
    $lookup: {
      from: "vehiculos",
      localField: "_id",
      foreignField: "propietario_id",
      as: "vehiculos",
    },
  },
  {
    $lookup: {
      from: "parqueos",
      localField: "vehiculos._id",
      foreignField: "vehiculo_id",
      as: "parqueos",
    },
  },
  {
    $unwind: "$parqueos",
  },
  {
    $lookup: {
      from: "sedes",
      localField: "parqueos.sede_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $lookup: {
      from: "zonas",
      localField: "parqueos.zona_id",
      foreignField: "_id",
      as: "zona_info",
    },
  },
  {
    $lookup: {
      from: "vehiculos",
      localField: "parqueos.vehiculo_id",
      foreignField: "_id",
      as: "vehiculo_parqueo",
    },
  },
  {
    $project: {
      nombre: 1,
      email: 1,
      fecha_entrada: "$parqueos.fecha_entrada",
      fecha_salida: "$parqueos.fecha_salida",
      sede_nombre: { $arrayElemAt: ["$sede_info.nombre", 0] },
      zona_nombre: { $arrayElemAt: ["$zona_info.nombre", 0] },
      vehiculo_placa: { $arrayElemAt: ["$vehiculo_parqueo.placa", 0] },
      vehiculo_tipo: { $arrayElemAt: ["$vehiculo_parqueo.tipo", 0] },
      tiempo_horas: { $divide: ["$parqueos.tiempo_total_minutos", 60] },
      costo_total: "$parqueos.costo_total",
      estado: "$parqueos.estado",
    },
  },
  {
    $sort: { fecha_entrada: -1 },
  },
])

// 7. Vehículos actualmente parqueados
db.parqueos.aggregate([
  {
    $match: { estado: "activo" },
  },
  {
    $lookup: {
      from: "vehiculos",
      localField: "vehiculo_id",
      foreignField: "_id",
      as: "vehiculo_info",
    },
  },
  {
    $lookup: {
      from: "sedes",
      localField: "sede_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $lookup: {
      from: "zonas",
      localField: "zona_id",
      foreignField: "_id",
      as: "zona_info",
    },
  },
  {
    $lookup: {
      from: "usuarios",
      localField: "vehiculo_info.propietario_id",
      foreignField: "_id",
      as: "propietario_info",
    },
  },
  {
    $project: {
      sede_nombre: { $arrayElemAt: ["$sede_info.nombre", 0] },
      zona_nombre: { $arrayElemAt: ["$zona_info.nombre", 0] },
      vehiculo_placa: { $arrayElemAt: ["$vehiculo_info.placa", 0] },
      vehiculo_tipo: { $arrayElemAt: ["$vehiculo_info.tipo", 0] },
      propietario_nombre: { $arrayElemAt: ["$propietario_info.nombre", 0] },
      fecha_entrada: 1,
      tiempo_transcurrido_horas: {
        $divide: [{ $subtract: [new Date(), "$fecha_entrada"] }, 3600000],
      },
    },
  },
  {
    $group: {
      _id: "$sede_nombre",
      vehiculos_activos: {
        $push: {
          placa: "$vehiculo_placa",
          tipo: "$vehiculo_tipo",
          zona: "$zona_nombre",
          propietario: "$propietario_nombre",
          horas_parqueado: { $round: ["$tiempo_transcurrido_horas", 1] },
        },
      },
      total_activos: { $sum: 1 },
    },
  },
])

// 8. Zonas que han excedido su capacidad
db.parqueos.aggregate([
  {
    $match: { estado: "activo" },
  },
  {
    $group: {
      _id: "$zona_id",
      vehiculos_activos: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: "zonas",
      localField: "_id",
      foreignField: "_id",
      as: "zona_info",
    },
  },
  {
    $lookup: {
      from: "sedes",
      localField: "zona_info.sede_id",
      foreignField: "_id",
      as: "sede_info",
    },
  },
  {
    $project: {
      sede_nombre: { $arrayElemAt: ["$sede_info.nombre", 0] },
      zona_nombre: { $arrayElemAt: ["$zona_info.nombre", 0] },
      capacidad_maxima: { $arrayElemAt: ["$zona_info.capacidad_maxima", 0] },
      vehiculos_activos: 1,
      excede_capacidad: {
        $gt: ["$vehiculos_activos", { $arrayElemAt: ["$zona_info.capacidad_maxima", 0] }],
      },
      porcentaje_ocupacion: {
        $multiply: [{ $divide: ["$vehiculos_activos", { $arrayElemAt: ["$zona_info.capacidad_maxima", 0] }] }, 100],
      },
    },
  },
  {
    $match: {
      $or: [{ excede_capacidad: true }, { porcentaje_ocupacion: { $gte: 90 } }],
    },
  },
  {
    $sort: { porcentaje_ocupacion: -1 },
  },
])
