# Grupo de Seguridad para la Base de Datos
resource "aws_security_group" "db_sg" {
  name        = "database-sg"
  description = "Permitir entrada de la API a la base de datos"
  vpc_id      = aws_vpc.main.id

  # Permitir puerto 5432 (PostgreSQL) desde cualquier parte de la VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Instancia de Base de Datos RDS (PostgreSQL) en zona privada
resource "aws_db_instance" "postgres_new" {
  identifier           = "ss-db-private"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro" # Capa gratuita
  allocated_storage     = 20
  storage_type         = "gp2"
  db_name              = "servicios_sociales_db"
  username             = "admin_user"
  password             = "secret_password_123"
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  publicly_accessible  = false # Seguridad: solo accesible dentro de nuestra red
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name = aws_db_subnet_group.private_group.name

  # Permitir que se cree antes de destruir para no quedar sin nada (opcional)
  # Pero aquí simplemente dejaremos que Terraform gestione el reemplazo
}

# El grupo de subredes que realmente se usa
resource "aws_db_subnet_group" "private_group" {
  name       = "private-db-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "Private DB Subnet Group"
  }
}

# Grupo de Seguridad para Redis
resource "aws_security_group" "redis_sg" {
  name        = "redis-sg"
  description = "Permitir entrada de la API a Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Cluster de Redis (ElastiCache)
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ss-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnets.name
}

resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "redis-subnets"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "db_endpoint" {
  value = aws_db_instance.postgres_new.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
