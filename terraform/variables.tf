variable "database_url" {
  description = "URL de conexión a la base de datos PostgreSQL"
  type        = string
  sensitive   = true
}

variable "jwt_private_key" {
  description = "Llave privada para firmar JWT"
  type        = string
  sensitive   = true
}

variable "jwt_public_key" {
  description = "Llave pública para verificar JWT"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "smtp_pass" {
  description = "Password para el servidor SMTP"
  type        = string
  sensitive   = true
}
