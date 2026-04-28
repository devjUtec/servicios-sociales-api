# 🇸🇻 Sistema de Gestión de Servicios Sociales — API

Este es el proyecto de backend para el **Sistema de Gestión de Servicios Sociales de El Salvador**, desarrollado como parte del proyecto de pre-especialización/graduación de la **UTEC**.

El sistema maneja la autenticación de personal administrativo y ciudadanos (cotizantes), gestión de afiliaciones, historial de contribuciones y auditoría de acciones.

## 🚀 Tecnologías Principales

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10 (TypeScript)
- **Base de Datos:** PostgreSQL (vía Prisma ORM)
- **Cache & Session:** Redis
- **Seguridad:** JWT (RS256), Passport, Bcrypt, Helmet
- **Documentación:** Swagger / OpenAPI (y `js-yaml` para exportación)

---

## 🛡️ Sistema de Bloqueo Automático y Anti-Bot

Nuestra API implementa una arquitectura de seguridad en 3 niveles, diseñada para contener ataques de fuerza bruta o spam (DDOS) en tiempo real, operando milisegundo a milisegundo:

1. **Tráfico Regular (Status 200/400):** El sistema permite un máximo estricto de **100 peticiones por minuto** para cada dirección IP. Este primer filtro es operado desde la memoria volátil (RAM) del servidor para evitar saturar la base de datos con peticiones masivas.
2. **Defensa Activa y Strikes (Status 429):** Al superar la cuota permitida, el escudo de red rechaza instantáneamente toda petición excesiva devolviendo `429 Too Many Requests`. De manera silenciosa y asíncrona, el Guard le anota el "Strike" respectivo a dicha IP en la tabla `IpBlacklist` de la base de datos.
3. **Bloqueo Permanente (Status 403):** Si el servidor nota reincidencia y tu IP acumula **3 Strikes**, el sistema baja una cortina de hierro catalogándote como `isPermanent = true`. A partir de este momento, todo rastro proveniente de esa IP devolverá un error `403 Forbidden` (Prohibido/Acceso Denegado), bloqueando permanentemente a los bots atacantes.

---

## 🛠️ Guía de Instalación para Colaboradores

Sigue estos pasos para levantar el proyecto en tu máquina local:

### 1. Pre-requisitos
Asegúrate de tener instalado:
- **Node.js 20+**
- **Docker Desktop** (para la base de datos y Redis)
- **Git**

### 2. Clonar e Instalar dependencias
```bash
git clone <url-del-repositorio>
cd servicios-sociales-api
npm install
```
> **Nota:** La instalación incluye `js-yaml`, necesario para generar el contrato de la API automáticamente.

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:
```bash
cp .env.example .env
```
> **Nota:** Edita el archivo `.env` con tus credenciales locales. Para el correo, puedes usar **Ethereal** (ver sección de correo abajo).

### 4. Generar claves RSA para JWT
El sistema usa firmas asimétricas (RS256). Debes generar un par de llaves:
```bash
# Crear carpeta para claves
mkdir keys

# Generar clave privada
openssl genrsa -out keys/private.pem 2048

# Generar clave pública
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```
Luego, copia el contenido de cada archivo PEM en las variables `JWT_PRIVATE_KEY` y `JWT_PUBLIC_KEY` de tu `.env`.

### 5. Levantar infraestructura (Docker)
Asegúrate de que Docker Desktop esté corriendo y ejecuta:
```bash
docker-compose up -d
```

### 6. Base de Datos: Migraciones y Seed
```bash
# Aplicar esquema a la base de datos
npx prisma migrate dev --name init

# Generar cliente de Prisma
npx prisma generate

# Poblar base de datos con datos de prueba
npx prisma db seed
```

### 💡 Tips de Mantenimiento de BD
- **Si solo cambiaste datos en `seed.ts`**: Ejecuta `npx prisma db seed` para actualizar la información sin borrar esquemas.
- **Si cambiaste la estructura (`schema.prisma`)**: Usa `npx prisma migrate reset --force`. Esto borrará todo, recreará las tablas y ejecutará el seed automáticamente.

---

## 🏃 Cómo ejecutar el proyecto

```bash
# Modo desarrollo con auto-recarga
npm run start:dev
```

Para que el archivo `swagger-spec.yaml` se sincronice correctamente con tu entorno local al usar Docker, asegúrate de incluir el volumen en tu `docker-compose.yml`:

```yaml
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
      - ./swagger-spec.yaml:/app/swagger-spec.yaml
    command: npm run start:dev
```

La API estará disponible en: [http://localhost:3000](http://localhost:3000)

---

## 📧 Pruebas de Correo (OTP)

Para el inicio de sesión de ciudadanos, el sistema envía un código OTP. Para probarlo localmente sin una cuenta real de Gmail:

1. Crea una cuenta gratuita en [Ethereal.email](https://ethereal.email/).
2. Configura los datos de SMTP que te den en tu `.env`.
3. Podrás ver los correos enviados en la pestaña **"Messages"** de la web de Ethereal.

---

## 📚 Documentación de Endpoints

La documentación se genera **automáticamente** desde el código usando el [plugin de Swagger de NestJS](https://docs.nestjs.com/openapi/cli-plugin).

### Acceso Web
Una vez que el servidor esté corriendo, puedes ver y probar todos los endpoints desde Swagger UI:
👉 [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Exportar YAML (swagger-spec.yaml)
Cada vez que el servidor arranca, se genera automáticamente un archivo físico `swagger-spec.yaml` en la raíz del proyecto.

#### Si usas Docker:
Para que Docker pueda escribir el archivo en tu carpeta local, primero debes crear el archivo vacío:
```bash
touch swagger-spec.yaml  # En Linux/Mac
type nul > swagger-spec.yaml # En Windows (PowerShell)
```
Luego ejecuta `docker:up`. El archivo se sincronizará automáticamente.

#### Si usas npm directamente:
Simplemente ejecuta `npm run start:dev` y el archivo se actualizará solo.

---

## 👥 Colaboración
Este proyecto es una colaboración académica para la **UTEC**. Por favor, mantén el código limpio y documenta cualquier cambio importante en el controlador o servicio correspondiente.
