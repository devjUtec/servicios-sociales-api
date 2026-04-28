import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('oauth')
@Controller('oauth')
export class OAuthController {

    /** Iniciar sesión con Google */
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: any) { }

    @Get('callback/google')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        return this.handleAuthRedirect(req.user, res);
    }

    /** Iniciar sesión con Azure AD */
    @Get('azure')
    @UseGuards(AuthGuard('azure'))
    async azureAuth(@Req() req: any) { }

    @Get('callback/azure')
    @UseGuards(AuthGuard('azure'))
    async azureAuthRedirect(@Req() req: any, @Res() res: Response) {
        return this.handleAuthRedirect(req.user, res);
    }

    private handleAuthRedirect(userTokens: any, res: Response) {
        // Tu frontend está en el puerto 3002
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        const { accessToken, refreshToken, user } = userTokens;
        
        // Redirigimos al frontend con los tokens
        return res.redirect(`${frontendUrl}/dashboard?token=${accessToken}&refresh=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
}
