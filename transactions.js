// Campus Parking - Transacciones Puras

// TRANSACCIÓN 1: Registrar ingreso de vehículo
function registrarIngresoVehiculo(vehiculoId, sedeId, zonaId, empleadoId) {
    const session = db.getMongo().startSession()
  
    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      })
  
      // Verificar disponibilidad de cupos
      const zona = db.collection("zonas").findOne({ _id: zonaId }, { session: session })
      if (!zona || zona.cupos_disponibles <= 0) {
        throw new Error("No hay cupos disponibles")
      }
  
      // Verificar vehículo activo
      const vehiculo = db.collection("vehiculos").findOne({ _id: vehiculoId, estado: "activo" }, { session: session })
      if (!vehiculo) {
        throw new Error("Vehículo no encontrado o inactivo")
      }
  
      // Verificar que no esté ya parqueado
      const parqueoActivo = db
        .collection("parqueos")
        .findOne({ vehiculo_id: vehiculoId, estado: "activo" }, { session: session })
      if (parqueoActivo) {
        throw new Error("El vehículo ya está parqueado")
      }
  
      // Verificar tipo de vehículo permitido
      if (!zona.tipos_vehiculo_permitidos.includes(vehiculo.tipo)) {
        throw new Error("Tipo de vehículo no permitido en esta zona")
      }
  
      // Insertar nuevo parqueo
      const nuevoParqueo = {
        vehiculo_id: vehiculoId,
        sede_id: sedeId,
        zona_id: zonaId,
        empleado_entrada_id: empleadoId,
        fecha_entrada: new Date(),
        fecha_salida: null,
        tiempo_total_minutos: 0,
        tarifa_aplicada: zona.tarifa_por_hora[vehiculo.tipo] || 0,
        costo_total: 0,
        metodo_pago: null,
        observaciones: "Ingreso registrado automáticamente",
        estado: "activo",
      }
  
      const resultadoParqueo = db.collection("parqueos").insertOne(nuevoParqueo, { session: session })
  
      // Actualizar cupos disponibles
      db.collection("zonas").updateOne(
        { _id: zonaId },
        {
          $inc: { cupos_disponibles: -1 },
          $set: { estado: zona.cupos_disponibles === 1 ? "llena" : zona.estado },
        },
        { session: session },
      )
  
      session.commitTransaction()
      return {
        success: true,
        parqueo_id: resultadoParqueo.insertedId,
        vehiculo_placa: vehiculo.placa,
        zona_nombre: zona.nombre,
        cupos_restantes: zona.cupos_disponibles - 1,
      }
    } catch (error) {
      session.abortTransaction()
      return { success: false, error: error.message }
    } finally {
      session.endSession()
    }
  }
  
  // TRANSACCIÓN 2: Registrar salida de vehículo
  function registrarSalidaVehiculo(parqueoId, empleadoId, metodoPago) {
    const session = db.getMongo().startSession()
  
    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      })
  
      // Buscar parqueo activo
      const parqueo = db.collection("parqueos").findOne({ _id: parqueoId, estado: "activo" }, { session: session })
      if (!parqueo) {
        throw new Error("Parqueo no encontrado o ya finalizado")
      }
  
      // Calcular tiempo y costo
      const fechaSalida = new Date()
      const tiempoTotalMinutos = Math.ceil((fechaSalida - parqueo.fecha_entrada) / (1000 * 60))
      const tiempoHoras = Math.ceil(tiempoTotalMinutos / 60)
      const costoTotal = tiempoHoras * parqueo.tarifa_aplicada
  
      // Actualizar registro de parqueo
      db.collection("parqueos").updateOne(
        { _id: parqueoId },
        {
          $set: {
            empleado_salida_id: empleadoId,
            fecha_salida: fechaSalida,
            tiempo_total_minutos: tiempoTotalMinutos,
            costo_total: costoTotal,
            metodo_pago: metodoPago,
            estado: "finalizado",
          },
        },
        { session: session },
      )
  
      // Incrementar cupos disponibles
      db.collection("zonas").updateOne(
        { _id: parqueo.zona_id },
        {
          $inc: { cupos_disponibles: 1 },
          $set: { estado: "activa" },
        },
        { session: session },
      )
  
      session.commitTransaction()
      return {
        success: true,
        tiempo_total_horas: Math.round((tiempoTotalMinutos / 60) * 100) / 100,
        costo_total: costoTotal,
        metodo_pago: metodoPago,
      }
    } catch (error) {
      session.abortTransaction()
      return { success: false, error: error.message }
    } finally {
      session.endSession()
    }
  }
 
  // ESCENARIO: Registrar un nuevo ingreso de vehículo
  // Esta operación debe ser atómica para mantener la consistencia:
  // 1. Insertar registro en la colección 'parqueos'
  // 2. Decrementar 'cupos_disponibles' en la colección 'zonas'
  // 3. Si cualquier operación falla, hacer rollback completo

  const vehiculoDemo = db.collection("vehiculos").findOne({ estado: "activo" })
  const sedeDemo = db.collection("sedes").findOne({ estado: "activa" })
  const zonaDemo = db.collection("zonas").findOne({
    sede_id: sedeDemo._id,
    cupos_disponibles: { $gt: 0 },
    tipos_vehiculo_permitidos: vehiculoDemo.tipo,
  })
  const empleadoDemo = db.collection("usuarios").findOne({ rol: "empleado_sede" })

  // Ejecutar transacción exitosa
  const resultado1 = registrarIngresoVehiculo(vehiculoDemo._id, sedeDemo._id, zonaDemo._id, empleadoDemo._id)
  
  console.log("\n RESULTADO DE LA TRANSACCIÓN:")
  if (resultado1.success) {
    console.log(" ÉXITO:")
    console.log(`   └─ Parqueo ID: ${resultado1.parqueo_id}`)
    console.log(`   └─ Vehículo: ${resultado1.vehiculo_placa}`)
    console.log(`   └─ Zona: ${resultado1.zona_nombre}`)
    console.log(`   └─ Cupos restantes: ${resultado1.cupos_restantes}`)
    console.log(`   └─ Tarifa: $${resultado1.tarifa_por_hora}/hora`)
  } else {
    console.log(` ERROR: ${resultado1.error}`)
  }
  
  // DEMOSTRACIÓN 2: Transacción con error (zona llena)

  // Buscar una zona sin cupos para demostrar el rollback
  const zonaSinCupos = db.collection("zonas").findOne({ cupos_disponibles: 0 })
  
  if (zonaSinCupos) {
    console.log(`\n INTENTANDO PARQUEAR EN ZONA LLENA:`)
    console.log(`   Zona: ${zonaSinCupos.nombre} (${zonaSinCupos.cupos_disponibles} cupos)`)
  
    const resultado2 = registrarIngresoVehiculo(vehiculoDemo._id, sedeDemo._id, zonaSinCupos._id, empleadoDemo._id)
  
    console.log("\n RESULTADO DE LA TRANSACCIÓN:")
    if (resultado2.success) {
      console.log(" ÉXITO (inesperado)")
    } else {
      console.log(` ERROR ESPERADO: ${resultado2.error}`)
      console.log("Rollback funcionó correctamente")
    }
  } else {
    console.log("ℹ️ No hay zonas llenas para demostrar el error")
  }
  
  // DEMOSTRACIÓN 3: Transacción de salida
  // Buscar un parqueo activo para la demostración
  const parqueoActivo = db.collection("parqueos").findOne({ estado: "activo" })
  
  if (parqueoActivo) {
    console.log(`\n REGISTRANDO SALIDA:`)
    console.log(`   Parqueo ID: ${parqueoActivo._id}`)
  
    const resultadoSalida = registrarSalidaVehiculo(parqueoActivo._id, empleadoDemo._id, "tarjeta")
  
    console.log("\n RESULTADO:")
    if (resultadoSalida.success) {
      console.log(" SALIDA REGISTRADA:")
      console.log(`   └─ Tiempo total: ${resultadoSalida.tiempo_total_horas} horas`)
      console.log(`   └─ Costo total: $${resultadoSalida.costo_total}`)
      console.log(`   └─ Método de pago: ${resultadoSalida.metodo_pago}`)
    } else {
      console.log(`ERROR: ${resultadoSalida.error}`)
    }
  } else {
    console.log("ℹ️ No hay parqueos activos para demostrar la salida")
  }
  
  
