# 1. Cluster de ECS (El cerebro que orquesta tus contenedores)
resource "aws_ecs_cluster" "main" {
  name = "servicios-sociales-cluster"
}

# 2. Roles de IAM (Permisos para que ECS funcione y lea de ECR)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs-task-execution-role-ss"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# 3. Application Load Balancer (EL PORTERO)
resource "aws_alb" "main" {
  name               = "api-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

# Grupo de Destino para la API
resource "aws_alb_target_group" "api" {
  name        = "api-target-group"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

# Grupo de Destino para la Web (Frontend)
resource "aws_alb_target_group" "web" {
  name        = "web-target-group"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

# El Escucha (El portero escucha en el puerto 80)
resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_alb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # Por defecto mandamos a la Web (Portal Público)
  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.web.arn
  }
}

# REGLA 1: Redirigir tráfico /api/* a la API
resource "aws_lb_listener_rule" "api_rule" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# 4. Grupos de Seguridad
resource "aws_security_group" "lb_sg" {
  name        = "alb-security-group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_tasks_sg" {
  name        = "ecs-tasks-security-group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 5. Definición de la Tarea: API
resource "aws_ecs_task_definition" "api" {
  family                   = "api-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([{
    name      = "servicios-sociales-api"
    image     = "${aws_ecr_repository.api.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
    }]
    environment = [
      { name = "REDIS_HOST", value = "${aws_elasticache_cluster.redis.cache_nodes[0].address}" },
      { name = "REDIS_PORT", value = "6379" },
      { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
      { name = "OPA_URL", value = "http://localhost:8181/v1/data/authz/allow" },
      { name = "DATABASE_URL", value = var.database_url },
      { name = "NODE_ENV", value = "production" },
      { name = "JWT_PRIVATE_KEY", value = var.jwt_private_key },
      { name = "JWT_PUBLIC_KEY", value = var.jwt_public_key },
      { name = "GOOGLE_CLIENT_ID", value = var.google_client_id },
      { name = "GOOGLE_CLIENT_SECRET", value = var.google_client_secret },
      { name = "GOOGLE_CALLBACK_URL", value = "http://${aws_alb.main.dns_name}/api/oauth/callback/google" },
      { name = "ALLOWED_ORIGINS", value = "http://${aws_alb.main.dns_name}" },
      { name = "RECAPTCHA_SECRET_KEY", value = var.recaptcha_secret_key },
      { name = "AZURE_CLIENT_ID", value = "dummy-azure-client-id" },
      { name = "AZURE_CLIENT_SECRET", value = "dummy-azure-client-secret" },
      { name = "AZURE_TENANT_ID", value = "dummy-azure-tenant-id" },
      { name = "AZURE_CALLBACK_URL", value = "http://${aws_alb.main.dns_name}/api/oauth/callback/azure" },
      { name = "GITHUB_CLIENT_ID", value = "dummy-github-client-id" },
      { name = "GITHUB_CLIENT_SECRET", value = "dummy-github-client-secret" },
      { name = "GITHUB_CALLBACK_URL", value = "http://${aws_alb.main.dns_name}/api/oauth/callback/github" },
      { name = "JWT_EXPIRES_IN", value = "15m" },
      { name = "JWT_REFRESH_EXPIRES_IN", value = "7d" },
      { name = "SMTP_HOST", value = "smtp.ethereal.email" },
      { name = "SMTP_PORT", value = "587" },
      { name = "SMTP_SECURE", value = "false" },
      { name = "SMTP_USER", value = "keeley54@ethereal.email" },
      { name = "SMTP_PASS", value = var.smtp_pass },
      { name = "FRONTEND_URL", value = "http://${aws_alb.main.dns_name}" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/servicios-sociales-api"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }, {
    name      = "opa"
    image     = "openpolicyagent/opa:latest"
    essential = true
    command   = ["run", "--server", "--log-level", "debug"]
    portMappings = [{
      containerPort = 8181
      hostPort      = 8181
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/servicios-sociales-opa"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# 6. Definición de la Tarea: WEB
resource "aws_ecs_task_definition" "web" {
  family                   = "web-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([{
    name      = "servicios-sociales-web"
    image     = "${aws_ecr_repository.web.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 80
      hostPort      = 80
    }]
    environment = [
      { name = "VITE_API_URL", value = "/api" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/servicios-sociales-web"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# 7. Servicios de ECS
resource "aws_ecs_service" "api" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.ecs_tasks_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.api.arn
    container_name   = "servicios-sociales-api"
    container_port   = 3000
  }
}

resource "aws_ecs_service" "web" {
  name            = "web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.ecs_tasks_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.web.arn
    container_name   = "servicios-sociales-web"
    container_port   = 80
  }
}

# Log Group para la API
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/servicios-sociales-api"
  retention_in_days = 7
}

# Log Group para la Web
resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/servicios-sociales-web"
  retention_in_days = 7
}

# Log Group para OPA
resource "aws_cloudwatch_log_group" "opa" {
  name              = "/ecs/servicios-sociales-opa"
  retention_in_days = 7
}

output "load_balancer_ip" {
  value = aws_alb.main.dns_name
}
