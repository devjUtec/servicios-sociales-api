import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OpaService {
  private readonly logger = new Logger(OpaService.name);
  private readonly opaUrl: string;

  constructor(private configService: ConfigService) {
    this.opaUrl = this.configService.get<string>('OPA_URL', 'http://localhost:8181/v1/data/authz/allow');
  }

  async checkPermission(user: any, action: string, resource: string, context?: any): Promise<boolean> {
    try {
      const input = {
        user: {
          id: user.id,
          roles: user.roles || [],
          institutionId: user.institutionId,
        },
        action,
        resource,
        context: context || {},
      };

      const response = await axios.post(this.opaUrl, { input });
      const allowed = response.data?.result === true;

      this.logger.debug(`OPA decision for user ${user.id} on ${resource}:${action}: ${allowed}`);
      return allowed;
    } catch (error) {
      this.logger.error('Error communicating with OPA:', error.message);
      // Fallback a false en caso de error para seguridad (Fail Closed)
      return false;
    }
  }
}
