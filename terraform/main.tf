terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  backend "s3" {
    bucket = "airwatch-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "airwatch-production"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "airwatch-enhanced.com"
}

# Data sources
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name = var.cluster_name
  tags = {
    Environment = var.environment
    Project     = "AirWatch Enhanced"
    ManagedBy   = "Terraform"
  }
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "${local.name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = local.tags
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"

  cluster_name    = local.name
  cluster_version = "1.28"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 10
      desired_size = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "default"
      }

      tags = local.tags
    }

    ml_workers = {
      min_size     = 1
      max_size     = 5
      desired_size = 2

      instance_types = ["c5.xlarge"]
      capacity_type  = "SPOT"

      labels = {
        Environment = var.environment
        NodeGroup   = "ml-workers"
        WorkloadType = "ml"
      }

      taints = {
        ml-workload = {
          key    = "ml-workload"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      }

      tags = local.tags
    }
  }

  tags = local.tags
}

# RDS PostgreSQL
module "db" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "${local.name}-db"

  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.medium"
  allocated_storage = 100
  max_allocated_storage = 1000

  db_name  = "airwatch"
  username = "airwatch_admin"
  port     = "5432"

  iam_database_authentication_enabled = true

  vpc_security_group_ids = [module.db_security_group.security_group_id]

  maintenance_window = "Mon:00:00-Mon:03:00"
  backup_window      = "03:00-06:00"

  monitoring_interval = 60
  monitoring_role_name = "AirWatchRDSEnhancedMonitoringRole"
  create_monitoring_role = true

  tags = local.tags

  # DB subnet group
  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets

  # DB parameter group
  family = "postgres15"

  # Snapshot identifier
  skip_final_snapshot = false
  deletion_protection = false

  backup_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Database Deletion Protection
  deletion_protection = true
}

# ElastiCache Redis
module "redis" {
  source = "terraform-aws-modules/elasticache/aws"

  cluster_id               = "${local.name}-redis"
  create_cluster           = true
  create_parameter_group   = true
  create_subnet_group      = true

  engine          = "redis"
  node_type       = "cache.t3.micro"
  num_cache_nodes = 1
  parameter_group_name = "${local.name}-redis"

  port = 6379

  subnet_ids               = module.vpc.private_subnets
  security_group_ids       = [module.redis_security_group.security_group_id]

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"

  tags = local.tags
}

# Security Groups
module "db_security_group" {
  source = "terraform-aws-modules/security-group/aws"

  name        = "${local.name}-db"
  description = "PostgreSQL security group"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 5432
      to_port                  = 5432
      protocol                 = "tcp"
      description              = "PostgreSQL"
      source_security_group_id = module.eks.cluster_primary_security_group_id
    },
  ]

  tags = local.tags
}

module "redis_security_group" {
  source = "terraform-aws-modules/security-group/aws"

  name        = "${local.name}-redis"
  description = "Redis security group"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      description              = "Redis"
      source_security_group_id = module.eks.cluster_primary_security_group_id
    },
  ]

  tags = local.tags
}

# Application Load Balancer
module "alb" {
  source = "terraform-aws-modules/alb/aws"

  name = "${local.name}-alb"

  load_balancer_type = "application"

  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.alb_security_group.security_group_id]

  target_groups = [
    {
      name_prefix      = "web-"
      backend_protocol = "HTTP"
      backend_port     = 80
      target_type      = "ip"
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }
    }
  ]

  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = module.acm.acm_certificate_arn
      target_group_index = 0
    }
  ]

  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = local.tags
}

module "alb_security_group" {
  source = "terraform-aws-modules/security-group/aws"

  name        = "${local.name}-alb"
  description = "ALB security group"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["https-443-tcp", "http-80-tcp"]

  egress_rules = ["all-all"]

  tags = local.tags
}

# ACM Certificate
module "acm" {
  source = "terraform-aws-modules/acm/aws"

  domain_name  = var.domain_name
  zone_id      = data.aws_route53_zone.this.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}",
  ]

  wait_for_validation = true

  tags = local.tags
}

# Route 53
data "aws_route53_zone" "this" {
  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "this" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.lb_dns_name
    zone_id                = module.alb.lb_zone_id
    evaluate_target_health = true
  }
}

# S3 Buckets
resource "aws_s3_bucket" "data_storage" {
  bucket = "${local.name}-data-storage"
  tags   = local.tags
}

resource "aws_s3_bucket_versioning" "data_storage" {
  bucket = aws_s3_bucket.data_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_storage" {
  bucket = aws_s3_bucket.data_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "backups" {
  bucket = "${local.name}-backups"
  tags   = local.tags
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${local.name}/application"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "system" {
  name              = "/aws/eks/${local.name}/system"
  retention_in_days = 7
  tags              = local.tags
}

# IAM Roles for IRSA (IAM Roles for Service Accounts)
module "irsa_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name = "${local.name}-irsa"

  oidc_providers = {
    ex = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:airwatch-backend", "default:airwatch-ml"]
    }
  }

  role_policy_arns = {
    policy = aws_iam_policy.airwatch_policy.arn
  }

  tags = local.tags
}

resource "aws_iam_policy" "airwatch_policy" {
  name        = "${local.name}-policy"
  description = "Policy for AirWatch Enhanced application"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_storage.arn,
          "${aws_s3_bucket.data_storage.arn}/*",
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      }
    ]
  })

  tags = local.tags
}

# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${local.name}-secrets"
  description             = "Application secrets for AirWatch Enhanced"
  recovery_window_in_days = 7

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_url = "postgresql://${module.db.db_instance_username}:${random_password.db_password.result}@${module.db.db_instance_endpoint}/${module.db.db_instance_name}"
    redis_url    = "redis://${module.redis.cluster_cache_nodes[0].address}:${module.redis.cluster_cache_nodes[0].port}"
    jwt_secret   = random_password.jwt_secret.result
  })
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.alb.lb_dns_name
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.db.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.cluster_cache_nodes[0].address
  sensitive   = true
}