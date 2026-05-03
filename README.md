# 🇸🇻 Sistema de Gestión de Servicios Sociales

Este repositorio contiene el sistema completo (Frontend y Backend) para el **Sistema de Gestión de Servicios Sociales de El Salvador**, un proyecto de pre-especialización/graduación de la **UTEC**.

El proyecto está dividido en dos partes principales:
1. **`servicios-sociales-api/`**: El backend construido con Node.js, NestJS y PostgreSQL.
2. **`servicios-sociales-web/`**: El frontend (panel web) construido con React, TypeScript y Vite.

---

## 🚀 Inicio Rápido (Levantar con Docker)

El proyecto está configurado para ejecutarse casi de forma automática utilizando **Docker**. El archivo de orquestación (`docker-compose.yml`) levantará la base de datos, la caché, la API y la aplicación Web de un solo golpe.

### Requisitos Previos
- **Docker** y **Docker Compose** instalados.
- **Node.js 20** (necesario solo para ejecutar el script que genera las llaves de seguridad locales).

### Pasos de Instalación

**1. Entrar a la carpeta de la API**
Toda la configuración principal de contenedores reside temporalmente en la carpeta de la API.
```bash
cd servicios-sociales-api
```

**2. Generar las llaves de seguridad y archivo `.env`**
El sistema utiliza firmas JWT asimétricas y variables de entorno. Para no configurar todo a mano, hemos provisto un script automático que hace el trabajo sucio por ti:
```bash
node scripts/generate-keys.js
```
*(Este comando generará tus llaves `private.pem` / `public.pem` en la carpeta `keys/` y creará automáticamente tu archivo `.env` a partir del `.env.example`).*

**3. Levantar toda la infraestructura**
```bash
sudo docker compose up -d
```
*(Docker descargará PostgreSQL, Redis, instalará las dependencias de Node.js de la API y de la Web, y levantará todos los servicios).*

---

## 🌐 Accesos Locales

Una vez que Docker termine de levantar todo (puede tardar unos minutos la primera vez), podrás acceder a:

- **Aplicación Web (Frontend):** [http://localhost:3002](http://localhost:3002)
- **API (Backend):** [http://localhost:3001](http://localhost:3001)
- **Documentación de la API (Swagger):** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 💡 Mantenimiento de la Base de Datos

Si necesitas poblar la base de datos con datos de prueba o aplicar migraciones, puedes hacerlo entrando al contenedor de la API o ejecutando Prisma localmente (si hiciste `npm install`):

```bash
# Entrar a la carpeta de la api si no lo estás
cd servicios-sociales-api

# Ejecutar las migraciones y sembrar datos semilla (requiere npm install previo)
npx prisma migrate dev --name init
npx prisma db seed
```

## 📝 Documentación Adicional
Para más detalles sobre la seguridad anti-bots, variables de entorno específicas y arquitectura del backend, revisa el [README de la API](./servicios-sociales-api/README.md).
