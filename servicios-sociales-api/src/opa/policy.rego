package authz

default allow = false

# Permitir a los super administradores hacer cualquier cosa
allow {
    "super_admin" == input.user.roles[_]
}

# Permitir a los ciudadanos ver sus propios recursos
allow {
    "citizen" == input.user.roles[_]
    input.action == "get"
    # Lógica base, requiere validación de ID en backend
}

# Médicos pueden consultar y editar récords según especialidad
allow {
    "doctor" == input.user.roles[_]
    # Lógica de especialidades a extender
}
