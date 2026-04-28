# Generar llave SSH para el Bastion
resource "tls_private_key" "bastion_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "bastion_key_pair" {
  key_name   = "bastion-ssh-key"
  public_key = tls_private_key.bastion_key.public_key_openssh
}

# Guardar la llave privada localmente para que el usuario la use
resource "local_file" "private_key" {
  content  = tls_private_key.bastion_key.private_key_pem
  filename = "${path.module}/bastion-key.pem"
  file_permission = "0400"
}

# Grupo de Seguridad para el Bastion
resource "aws_security_group" "bastion_sg" {
  name        = "bastion-sg"
  description = "Permitir SSH para Tunel VPN"
  vpc_id      = aws_vpc.main.id

  # SSH (Puerto 22) - Solo para nosotros
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Podras restringirlo a tu IP luego para mas seguridad
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bastion-security-group"
  }
}

# Servidor Bastion (Puente Seguro)
resource "aws_instance" "bastion" {
  ami           = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS en us-east-1
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public_1.id
  key_name      = aws_key_pair.bastion_key_pair.key_name

  # Valor por defecto en AWS; se fija explícito tras pruebas con subnet router.
  source_dest_check = true

  vpc_security_group_ids = [aws_security_group.bastion_sg.id]

  # Script para preparar el servidor para tunneling
  user_data = <<-EOF
              #!/bin/bash
              echo "GatewayPorts yes" >> /etc/ssh/sshd_config
              systemctl restart ssh
              EOF

  tags = {
    Name = "Bastion-Public-Bridge"
  }
}

# Output para saber como conectarnos
output "bastion_public_ip" {
  value = aws_instance.bastion.public_ip
}
