import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de excepciones.
 * Captura tanto errores HTTP controlados como excepciones no manejadas (500).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('AllExceptionsFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | object = 'Internal server error';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            
            if (typeof res === 'object') {
                message = (res as any).message || (res as any).errorMessage || (res as any).error || JSON.stringify(res);
                error = (res as any).error || 'Error';
            } else {
                message = res;
                error = status === 429 ? 'Security Block' : 'Error';
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            // No revelamos el stack trace en la respuesta JSON por seguridad, 
            // pero sí lo loggeamos internamente.
            this.logger.error(
                `Unhandled Exception: ${exception.message}`,
                exception.stack,
            );
        } else {
            this.logger.error('Unknown Exception', JSON.stringify(exception));
        }

        const errorBody = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error: error,
            message: message,
        };

        if (status === HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof HttpException)) {
             this.logger.error(
                `CRITICAL 500: ${request.method} ${request.url} - ${JSON.stringify(message)}`,
            );
        } else {
            this.logger.warn(
                `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
            );
        }

        response.status(status).json(errorBody);
    }
}
