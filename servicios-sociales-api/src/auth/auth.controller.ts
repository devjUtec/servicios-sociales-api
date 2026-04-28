import { Controller, Post, Body, UseGuards, Req, Get, Headers, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CitizenLoginDto } from './dto/citizen-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /** Obtener un CAPTCHA visual (letras) */
    @Get('captcha')
    @ApiOperation({ summary: 'Generar un CAPTCHA visual' })
    async getCaptcha() {
        return this.authService.generateVisualCaptcha();
    }

    /** Activar cuenta institucional con contraseña */
    @Post('activate')
    async activate(@Body() body: { email: string; password: string }) {
        console.log(`[AUTH] Intentando activar cuenta para: ${body.email}`);
        return this.authService.activateAccount(body.email, body.password);
    }

    /** Registrar un nuevo usuario administrativo (Uso interno) */
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    /** Iniciar sesión (Personal Administrativo/Médico) */
    @Post('login')
    async login(
        @Body() loginDto: LoginDto,
        @Headers('user-agent') userAgent: string,
        @Ip() ip: string
    ) {
        return this.authService.login(loginDto, userAgent, ip);
    }

    /** Iniciar sesión (Ciudadanos/Cotizantes) - Paso 1 */
    @Post('citizen/login')
    async citizenLogin(
        @Body() citizenLoginDto: CitizenLoginDto,
        @Headers('user-agent') userAgent: string,
        @Ip() ip: string
    ) {
        return this.authService.citizenLogin(citizenLoginDto, userAgent, ip);
    }

    /** Validar código OTP y obtener token (Personal Interno) - Paso 2 */
    @Post('verify-otp')
    async verifyInternalOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyInternalOtp(verifyOtpDto.email, verifyOtpDto.code);
    }

    /** Validar código OTP y obtener token (Ciudadanos) - Paso 2 */
    @Post('citizen/verify-otp')
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyCitizenOtp(verifyOtpDto.email, verifyOtpDto.code);
    }

    /** Renovar el access token usando un refresh token */
    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }

    /** Cerrar sesión e invalidar el refresh token */
    @Post('logout')
    async logout(
        @Body('refreshToken') refreshToken: string,
        @Headers('user-agent') userAgent: string,
        @Ip() ip: string
    ) {
        await this.authService.logout(refreshToken, userAgent, ip);
        return { message: 'Sesión cerrada exitosamente' };
    }

    /** Activar cuenta ciudadana y crear contraseña desde invitación */
    @Post('citizen/activate')
    async activateCitizenAccount(
        @Body() body: any,
        @Headers('user-agent') userAgent: string,
        @Ip() ipAddress: string
    ) {
        return this.authService.activateCitizenAccount(body.email, body.code, body.password, userAgent, ipAddress);
    }
}
