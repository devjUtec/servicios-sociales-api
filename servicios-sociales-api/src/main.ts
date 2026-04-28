import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
// csurf no requerido: JWT Bearer Token es inmune a CSRF por diseño
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);

  // Global prefix para coincidir con la regla /api/* del Load Balancer
  // Excluimos /health para que el health check del ALB siga funcionando
  app.setGlobalPrefix('api', { exclude: ['/health'] });

  app.use(cookieParser());

  // ============================================
  // SEGURIDAD: Helmet (HTTP Security Headers)
  // ============================================
  app.use(
    (helmet as any).default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // ============================================
  // CORS
  // ============================================
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3000')
    .split(',');

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 3600,
  });

  // ============================================
  // VALIDACIÓN GLOBAL
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ============================================
  // SWAGGER / OPENAPI
  // ============================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Servicios Sociales API')
    .setDescription(
      `API de autenticación y gestión para instituciones de servicios sociales de El Salvador.
      
**Instituciones soportadas:** ISSS, AFP, ISBM, IPSFA, INPEP

**Autenticación:** JWT Bearer Token (RS256)

**Roles disponibles:** super_admin, doctor, institution_staff, citizen

**Credenciales de prueba:**
- Super Admin: admin@ssapi.gob.sv / Admin123!
- Ciudadanos: Usar datos generados en la tabla Citizen (ej. juan.perez@example.com)`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación y gestión de sesiones')
    .addTag('oauth', 'Autenticación OAuth2 (Google, Azure)')
    .addTag('users', 'Gestión de personal interno')
    .addTag('roles', 'Gestión de roles y permisos')
    .addTag('affiliation', 'Gestión de afiliaciones')
    .addTag('contribution', 'Gestión de contribuciones y pagos')
    .addTag('medical-record', 'Expedientes médicos (solo instituciones de salud)')
    .addTag('audit', 'Logs de auditoría')
    .addTag('health', 'Estado del sistema')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Guardar el archivo YAML físico solo en desarrollo para no crashear en producción
  if (process.env.NODE_ENV !== 'production') {
    try {
      const yamlFileContent = yaml.dump(document, {
        noRefs: true,
        lineWidth: -1,
      });
      fs.writeFileSync('./swagger-spec.yaml', yamlFileContent);
      console.log('✅ Archivo swagger-spec.yaml actualizado');
    } catch (e) {
      console.warn('No se pudo escribir swagger-spec.yaml (puede ignorarse en producción)', e.message);
    }
  }

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);
  console.log(`\n Servicios Sociales API corriendo en: http://localhost:${port}`);
  console.log(`Documentación Swagger: http://localhost:${port}/api/docs`);
  console.log(`Health check: http://localhost:${port}/health\n`);
}

bootstrap();
