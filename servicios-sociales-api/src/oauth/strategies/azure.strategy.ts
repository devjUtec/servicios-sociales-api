import { PassportStrategy } from '@nestjs/passport';
import { OIDCStrategy } from 'passport-azure-ad';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../oauth.service';

@Injectable()
export class AzureStrategy extends PassportStrategy(OIDCStrategy, 'azure') {
    constructor(
        config: ConfigService,
        private oauthService: OAuthService,
    ) {
        super({
            identityMetadata: `https://login.microsoftonline.com/${config.get('AZURE_TENANT_ID')}/v2.0/.well-known/openid-configuration`,
            clientID: config.get('AZURE_CLIENT_ID'),
            responseType: 'code id_token',
            responseMode: 'form_post',
            redirectUrl: config.get('AZURE_CALLBACK_URL'),
            allowHttpForRedirectUrl: true,
            clientSecret: config.get('AZURE_CLIENT_SECRET'),
            validateIssuer: false,
            passReqToCallback: false,
            scope: ['profile', 'email', 'openid'],
        } as any);
    }

    async validate(profile: any, done: any): Promise<any> {
        const { _json } = profile;
        const user = {
            email: _json.email || _json.preferred_username,
            firstName: _json.given_name || 'Azure',
            lastName: _json.family_name || 'User',
            provider: 'azure',
            providerId: _json.oid,
        };

        // @ts-ignore
        const result = await this.oauthService.validateOAuthUser(user);
        done(null, result);
    }
}
