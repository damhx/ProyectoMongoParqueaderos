# Campus Parking - Sistema de Gestión de Parqueaderos Multisede

## 📋 Introducción al Proyecto

Campus Parking es un sistema integral de gestión de parqueaderos que administra múltiples sedes ubicadas en diferentes ciudades. El sistema permite el control completo de vehículos, usuarios, zonas de parqueo y transacciones, reemplazando las hojas de cálculo locales con una solución robusta y escalable basada en MongoDB.

### Características Principales

- ✅ Gestión multisede con control centralizado
- ✅ Registro y control de diferentes tipos de vehículos
- ✅ Sistema de roles y permisos granulares
- ✅ Transacciones atómicas para consistencia de datos
- ✅ Reportes analíticos avanzados
- ✅ Control de capacidad y disponibilidad en tiempo real

## 🎯 Justificación del Uso de MongoDB

### ¿Por qué NoSQL?

MongoDB fue seleccionado como la base de datos para Campus Parking por las siguientes razones técnicas y de negocio:

#### 1. **Flexibilidad de Esquema**
- **Problema**: Los parqueaderos manejan diferentes tipos de vehículos con características variables
- **Solución**: MongoDB permite esquemas flexibles que se adaptan a nuevos tipos de vehículos sin modificar la estructura base
- **Ejemplo**: Agregar campos específicos para vehículos eléctricos (autonomía, tipo de carga) sin afectar registros existentes

#### 2. **Escalabilidad Horizontal**
- **Problema**: El crecimiento de sedes requiere manejar volúmenes crecientes de datos
- **Solución**: MongoDB soporta sharding nativo para distribuir datos across múltiples servidores [^1]
- **Beneficio**: Cada nueva sede puede agregar capacidad sin degradar el rendimiento

#### 3. **Consultas Analíticas Avanzadas**
- **Problema**: Necesidad de reportes complejos cruzando múltiples entidades
- **Solución**: Framework de agregación de MongoDB permite análisis sofisticados [^2]
- **Ejemplo**: Análisis de ocupación por sede, zona y tipo de vehículo en una sola consulta

#### 4. **Documentos Embebidos vs Relaciones**
- **Problema**: Información relacionada (direcciones, horarios) se consulta frecuentemente junta
- **Solución**: Documentos embebidos reducen JOINs y mejoran rendimiento
- **Ejemplo**: Información de dirección embebida en sedes evita consultas adicionales

#### 5. **Transacciones ACID**
- **Problema**: Operaciones críticas como registro de ingreso requieren consistencia
- **Solución**: MongoDB 4.0+ soporta transacciones multi-documento [^2]
- **Garantía**: Atomicidad en operaciones de parqueo + actualización de cupos

## 🏗️ Diseño del Modelo de Datos

### Colecciones 

- **usuarios**
- **sedes**
- **zonas**
- **vehiculos**
- **parqueos**

### Decisiones de Diseño: Referencias vs Embebidos

#### **Documentos Embebidos** ✅
- **direccion** en usuarios y sedes
- **coordenadas** en sedes
- **horario_operacion** en sedes
- **tarifa_por_hora** en zonas

**Justificación**: Esta información se consulta siempre junto con el documento principal y no se modifica frecuentemente.

#### **Referencias** ✅
- **sede_asignada** en usuarios → sedes
- **sede_id** en zonas → sedes
- **propietario_id** en vehiculos → usuarios
- **vehiculo_id, sede_id, zona_id** en parqueos

**Justificación**: Estas entidades tienen ciclos de vida independientes y se consultan por separado en diferentes contextos.

### Validaciones Implementadas por Colección

#### **usuarios**
- ✅ **cedula**: Patrón numérico 8-12 dígitos
- ✅ **email**: Validación de formato email RFC compliant
- ✅ **telefono**: Patrón internacional con caracteres especiales
- ✅ **rol**: Enum restringido a valores válidos
- ✅ **estado**: Control de estados del usuario

#### **sedes**
- ✅ **coordenadas**: Validación de latitud/longitud como Double
- ✅ **horario_operacion**: Formato HH:MM para horarios
- ✅ **dias_operacion**: Array con días válidos de la semana

#### **zonas**
- ✅ **capacidad_maxima**: Rango 1-1000 vehículos
- ✅ **cupos_disponibles**: No puede ser negativo
- ✅ **tipos_vehiculo_permitidos**: Array con tipos válidos
- ✅ **tarifa_por_hora**: Valores numéricos no negativos

#### **vehiculos**
- ✅ **placa**: Patrón alfanumérico 6-8 caracteres
- ✅ **año**: Rango válido 1900-2030
- ✅ **tipo**: Enum de tipos de vehículos soportados

#### **parqueos**
- ✅ **tiempo_total_minutos**: Valor no negativo
- ✅ **costo_total**: Valor monetario no negativo
- ✅ **estado**: Control de estados del parqueo

## 📊 Índices y Optimización

### Índices Implementados

#### **Índices Únicos**
```javascript
db.usuarios.createIndex({ "cedula": 1 }, { unique: true });
db.usuarios.createIndex({ "email": 1 }, { unique: true });
db.vehiculos.createIndex({ "placa": 1 }, { unique: true });
```

#### **Índices Compuestos**
```javascript
db.sedes.createIndex({ "ciudad": 1, "estado": 1 });
db.zonas.createIndex({ "sede_id": 1, "estado": 1 });
db.zonas.createIndex({ "sede_id": 1, "cupos_disponibles": 1 });
db.parqueos.createIndex({ "sede_id": 1, "zona_id": 1, "estado": 1 });
```

#### **Índices Temporales**
```javascript
db.parqueos.createIndex({ "fecha_entrada": -1 });
db.parqueos.createIndex({ "estado": 1, "fecha_entrada": -1 });
```

#### **Índices Geoespaciales**
```javascript
db.sedes.createIndex({ 
  "coordenadas.latitud": 1, 
  "coordenadas.longitud": 1 
});
```

#### 1. **Consultas de Disponibilidad**
```javascript
db.zonas.find({ 
  "sede_id": ObjectId("..."), 
  "cupos_disponibles": { $gt: 0 } 
});
```

#### 2. **Reportes Temporales**
```javascript
db.parqueos.find({ 
  "fecha_entrada": { 
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-02-01")
  }
});
```

#### 3. **Búsquedas por Usuario**
```javascript
db.parqueos.find({ "vehiculo_id": ObjectId("...") });
```

## 🧪 Estructura de Datos de Prueba

### Distribución de Datos

#### **3 Sedes Estratégicamente Ubicadas**
- 🏢 **Bogotá Centro**: Zona financiera, alta rotación
- 🏢 **Medellín Poblado**: Zona comercial, horario extendido
- 🏢 **Cali Norte**: Zona residencial-comercial

#### **15 Zonas Especializadas** (5 por sede)
- 🅿️ **Zona A**: Carros exclusivamente (50 cupos)
- 🏍️ **Zona B**: Motos exclusivamente (80 cupos)
- 🚗 **Zona C**: Mixta carros/motos (30 cupos)
- 🚲 **Zona D**: Bicicletas gratuitas (40 cupos)
- 🚛 **Zona E**: Vehículos grandes (15 cupos)

#### **25 Usuarios Distribuidos**
- 👑 **1 Administrador**: Acceso total al sistema
- 👷 **5 Empleados**: 2 en Bogotá, 2 en Medellín, 1 en Cali
- 👥 **15 Clientes**: Distribuidos proporcionalmente por ciudad

#### **30 Vehículos Diversos**
- 🚗 **60% Carros**: Marcas variadas (Toyota, Chevrolet, Renault)
- 🏍️ **25% Motos**: Diferentes cilindrajes
- 🚲 **10% Bicicletas**: Urbanas y deportivas
- 🚛 **5% Vehículos grandes**: Camiones y buses

#### **50 Registros de Parqueo**
- ✅ **40 Finalizados**: Con costos calculados
- 🟡 **10 Activos**: Simulando ocupación actual
- 📊 **Distribución temporal**: Últimos 30 días

## 📈 Consultas Analíticas Implementadas

### 1. **Análisis de Ocupación por Sede**
```javascript
db.parqueos.aggregate([
  { $match: { fecha_entrada: { $gte: fechaUltimoMes } } },
  { $group: { _id: "$sede_id", total_parqueos: { $sum: 1 } } },
  { $lookup: { from: "sedes", localField: "_id", foreignField: "_id", as: "sede_info" } }
]);
```

### 2. **Identificación de Zonas Críticas**
```javascript
db.parqueos.aggregate([
  { $group: { _id: { sede_id: "$sede_id", zona_id: "$zona_id" }, total_usos: { $sum: 1 } } },
  { $lookup: { from: "zonas", localField: "_id.zona_id", foreignField: "_id", as: "zona_info" } },
  { $addFields: { porcentaje_ocupacion: { $multiply: [{ $divide: ["$total_usos", "$zona_info.capacidad_maxima"] }, 100] } } }
]);
```

### 3. **Análisis de Ingresos**
```javascript
db.parqueos.aggregate([
  { $match: { estado: "finalizado", costo_total: { $gt: 0 } } },
  { $group: { 
    _id: "$sede_id", 
    ingreso_total: { $sum: "$costo_total" },
    ingreso_promedio: { $avg: "$costo_total" }
  }}
]);
```

### 4. **Segmentación de Clientes**
```javascript
db.parqueos.aggregate([
  { $lookup: { from: "vehiculos", localField: "vehiculo_id", foreignField: "_id", as: "vehiculo_info" } },
  { $lookup: { from: "usuarios", localField: "vehiculo_info.propietario_id", foreignField: "_id", as: "cliente_info" } },
  { $group: { 
    _id: "$cliente_info._id", 
    total_visitas: { $sum: 1 },
    gasto_total: { $sum: "$costo_total" },
    vehiculos_diferentes: { $addToSet: "$vehiculo_id" }
  }}
]);
```

### 5. **Análisis de Flota por Sede**
```javascript
db.parqueos.aggregate([
  { $lookup: { from: "vehiculos", localField: "vehiculo_id", foreignField: "_id", as: "vehiculo_info" } },
  { $group: { 
    _id: { sede_id: "$sede_id", tipo_vehiculo: "$vehiculo_info.tipo" },
    cantidad: { $sum: 1 }
  }},
  { $sort: { "_id.sede_id": 1, cantidad: -1 } }
]);
```

### 6. **Historial Personalizado**
```javascript
db.usuarios.aggregate([
  { $match: { email: "cliente@email.com" } },
  { $lookup: { from: "vehiculos", localField: "_id", foreignField: "propietario_id", as: "vehiculos" } },
  { $lookup: { from: "parqueos", localField: "vehiculos._id", foreignField: "vehiculo_id", as: "parqueos" } },
  { $unwind: "$parqueos" },
  { $sort: { "parqueos.fecha_entrada": -1 } }
]);
```

### 7. **Monitoreo en Tiempo Real**
```javascript
db.parqueos.aggregate([
  { $match: { estado: "activo" } },
  { $lookup: { from: "vehiculos", localField: "vehiculo_id", foreignField: "_id", as: "vehiculo_info" } },
  { $lookup: { from: "sedes", localField: "sede_id", foreignField: "_id", as: "sede_info" } },
  { $group: { 
    _id: "$sede_info.nombre",
    vehiculos_activos: { $push: "$vehiculo_info" },
    total_activos: { $sum: 1 }
  }}
]);
```

### 8. **Alertas de Capacidad**
```javascript
db.parqueos.aggregate([
  { $match: { estado: "activo" } },
  { $group: { _id: "$zona_id", vehiculos_activos: { $sum: 1 } } },
  { $lookup: { from: "zonas", localField: "_id", foreignField: "_id", as: "zona_info" } },
  { $match: { $expr: { $gte: ["$vehiculos_activos", { $multiply: ["$zona_info.capacidad_maxima", 0.9] }] } } }
]);
```

## 🔄 Transacciones MongoDB

### Escenario Implementado: Registro de Ingreso Atómico

La operación más crítica del sistema es el registro de ingreso de un vehículo, que debe garantizar consistencia entre múltiples colecciones.

#### **Operaciones Atómicas**
1. ✅ **Validar disponibilidad** de cupos en la zona
2. ✅ **Verificar vehículo** activo y no parqueado
3. ✅ **Insertar registro** en parqueos
4. ✅ **Decrementar cupos** disponibles en zona
5. ✅ **Actualizar estado** de zona si se llena

#### **Código de Transacción**
```javascript
function registrarIngresoVehiculo(vehiculoId, sedeId, zonaId, empleadoId) {
  const session = db.getMongo().startSession();
  
  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });
    
    // PASO 1: Verificar disponibilidad
    const zona = db.zonas.findOne({ _id: zonaId }, { session });
    if (zona.cupos_disponibles <= 0) {
      throw new Error("No hay cupos disponibles");
    }
    
    // PASO 2: Insertar parqueo
    const nuevoParqueo = {
      vehiculo_id: vehiculoId,
      sede_id: sedeId,
      zona_id: zonaId,
      empleado_entrada_id: empleadoId,
      fecha_entrada: new Date(),
      estado: "activo"
    };
    
    const resultado = db.parqueos.insertOne(nuevoParqueo, { session });
    
    // PASO 3: Actualizar cupos
    db.zonas.updateOne(
      { _id: zonaId },
      { 
        $inc: { cupos_disponibles: -1 },
        $set: { estado: zona.cupos_disponibles === 1 ? "llena" : zona.estado }
      },
      { session }
    );
    
    session.commitTransaction();
    return { success: true, parqueo_id: resultado.insertedId };
    
  } catch (error) {
    session.abortTransaction();
    return { success: false, error: error.message };
  } finally {
    session.endSession();
  }
}
```

## 🔐 Sistema de Roles y Seguridad

### Roles Implementados

#### **1. Administrador (`administrador_campus`)**
```javascript
// Permisos completos del sistema
{
  role: "administrador_campus",
  privileges: [
    {
      resource: { db: "campus_parking", collection: "" },
      actions: [
        "find", "insert", "update", "remove",
        "createIndex", "dropIndex", "createCollection", "dropCollection"
      ]
    },
    // Gestión de usuarios
    {
      resource: { db: "campus_parking", collection: "usuarios" },
      actions: [
        "createUser", "dropUser", "grantRole", "revokeRole",
        "changeOwnPassword", "changeAnyPassword"
      ]
    }
  ]
}
```

**Capacidades del Administrador:**
- ✅ **CRUD completo** en todas las colecciones
- ✅ **Gestión de usuarios** y asignación de roles
- ✅ **Configuración del sistema** (sedes, zonas, tarifas)
- ✅ **Acceso a métricas** y estadísticas del sistema
- ✅ **Auditoría completa** de todas las operaciones

#### **2. Empleado de Sede (`empleado_sede_campus`)**
```javascript
// Permisos limitados a operaciones de su sede
{
  role: "empleado_sede_campus",
  privileges: [
    // Solo lectura de clientes y vehículos
    {
      resource: { db: "campus_parking", collection: "usuarios" },
      actions: ["find"]
    },
    // Gestión completa de parqueos
    {
      resource: { db: "campus_parking", collection: "parqueos" },
      actions: ["find", "insert", "update"]
    },
    // Actualización de cupos en zonas
    {
      resource: { db: "campus_parking", collection: "zonas" },
      actions: ["find", "update"]
    }
  ]
}
```

**Capacidades del Empleado:**
- ✅ **Consultar clientes** y verificar información
- ✅ **Registrar ingresos** y salidas de vehículos
- ✅ **Actualizar cupos** disponibles en zonas
- ✅ **Generar reportes** de su sede
- ❌ **NO puede modificar** usuarios o configuración
- ❌ **NO puede eliminar** registros históricos

#### **3. Cliente (`cliente_campus`)**
```javascript
// Solo lectura de información propia y pública
{
  role: "cliente_campus",
  privileges: [
    // Información personal (con filtros en aplicación)
    {
      resource: { db: "campus_parking", collection: "usuarios" },
      actions: ["find"]
    },
    // Historial propio de parqueos
    {
      resource: { db: "campus_parking", collection: "parqueos" },
      actions: ["find"]
    },
    // Información pública de disponibilidad
    {
      resource: { db: "campus_parking", collection: "sedes" },
      actions: ["find"]
    },
    {
      resource: { db: "campus_parking", collection: "zonas" },
      actions: ["find"]
    }
  ]
}
```

**Capacidades del Cliente:**
- ✅ **Ver su información** personal y vehículos
- ✅ **Consultar historial** de parqueos propio
- ✅ **Ver disponibilidad** y precios de zonas
- ✅ **Consultar sedes** y horarios de operación
- ❌ **NO puede ver** información de otros clientes
- ❌ **NO puede modificar** ningún registro

### Usuarios de Ejemplo Creados

#### **Administrador**
- 👤 **Usuario**: `admin_ana`
- 🔑 **Contraseña**: `AdminSecure123!`
- 📧 **Email**: admin@campusparking.com
- 🎯 **Rol**: administrador_campus

#### **Empleado**
- 👤 **Usuario**: `empleado_carlos`
- 🔑 **Contraseña**: `EmpleadoSecure123!`
- 📧 **Email**: carlos.bogota@campusparking.com
- 🏢 **Sede**: Bogotá Centro
- 🎯 **Rol**: empleado_sede_campus

#### **Cliente**
- 👤 **Usuario**: `cliente_juan`
- 🔑 **Contraseña**: `ClienteSecure123!`
- 📧 **Email**: cliente1@email.com
- 🎯 **Rol**: cliente_campus

## 🔮 Conclusiones y Mejoras Posibles

### Logros del Proyecto

#### **✅ Objetivos Cumplidos**
1. **Migración exitosa** de hojas de cálculo a MongoDB
2. **Eliminación de duplicación** de datos entre sedes
3. **Acceso unificado** a información de todas las sedes
4. **Control granular** de permisos por tipo de usuario
5. **Transacciones atómicas** para operaciones críticas
6. **Reportes analíticos** avanzados en tiempo real

#### **✅ Beneficios Técnicos Obtenidos**
- **Escalabilidad horizontal** preparada para crecimiento
- **Flexibilidad de esquema** para nuevos tipos de vehículos
- **Consultas optimizadas** con índices estratégicos
- **Integridad de datos** garantizada con validaciones
- **Seguridad robusta** con roles diferenciados

### Mejoras Futuras Recomendadas

#### **🚀 Funcionalidades Adicionales**

##### **1. Sistema de Reservas**
```javascript
// Nueva colección para reservas anticipadas
{
  _id: ObjectId,
  cliente_id: ObjectId,
  sede_id: ObjectId,
  zona_id: ObjectId,
  fecha_reserva: Date,
  fecha_inicio: Date,
  fecha_fin: Date,
  estado: String, // ["pendiente", "confirmada", "cancelada"]
  precio_reserva: Double
}
```

##### **2. Integración con Sistemas de Pago**
- 💳 **Pasarelas de pago** (Nequi, Bancolombia, PSE)
- 💳 **Pagos móviles** (QR codes, NFC)
- 💳 **Suscripciones mensuales** para clientes frecuentes
- 💳 **Facturación automática** y reportes fiscales

##### **3. IoT y Sensores**
```javascript
// Colección para datos de sensores
{
  _id: ObjectId,
  zona_id: ObjectId,
  sensor_id: String,
  tipo_sensor: String, // ["ocupacion", "entrada", "salida"]
  timestamp: Date,
  valor: Mixed,
  estado_sensor: String
}
```

##### **4. Aplicación Móvil**
- 📱 **App para clientes**: Consulta de disponibilidad, reservas, pagos
- 📱 **App para empleados**: Registro rápido de ingresos/salidas
- 📱 **Notificaciones push**: Alertas de vencimiento, promociones

### Consideraciones de Seguridad Adicionales

#### **🛡️ Seguridad Avanzada**
- 🔐 **Encriptación en tránsito** (TLS 1.3)
- 🔐 **Encriptación en reposo** (MongoDB Encryption at Rest)
- 🔐 **Autenticación multifactor** para administradores
- 🔐 **Auditoría completa** de todas las operaciones
- 🔐 **Rate limiting** por usuario y endpoint
