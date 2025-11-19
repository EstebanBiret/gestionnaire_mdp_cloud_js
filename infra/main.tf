terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region     = var.region
  access_key = var.access_key
  secret_key = var.secret_key

  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3          = var.endpoint
    dynamodb    = var.endpoint
    sqs         = var.endpoint
    lambda      = var.endpoint
    iam         = var.endpoint
    sts         = var.endpoint
    apigateway  = var.endpoint
    cloudfront  = var.endpoint
  }
}

# ============================
# S3 BUCKETS
# ============================

# Bucket pour les backups
resource "aws_s3_bucket" "backups" {
  bucket = var.s3_bucket

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  acl = "private"
  versioning {
    enabled = true
  }

  lifecycle_rule {
    enabled = true
    abort_incomplete_multipart_upload_days = 7
  }
}

# Bucket pour le frontend statique
resource "aws_s3_bucket" "frontend" {
  bucket = "password-manager-frontend"
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ============================
# SQS QUEUES
# ============================

resource "aws_sqs_queue" "password_logs" {
  name = var.sqs_password_queue_name
}

resource "aws_sqs_queue" "auth_logs" {
  name = var.sqs_auth_queue_name
}

# ============================
# DYNAMODB TABLES
# ============================

resource "aws_dynamodb_table" "passwords" {
  name         = var.dynamodb_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "passwordId"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "passwordId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "login-index"
    hash_key        = "login"
    projection_type = "ALL"
  }

  attribute {
    name = "login"
    type = "S"
  }
}

resource "aws_dynamodb_table" "sessions" {
  name         = "sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}

# ============================
# IAM ROLE FOR LAMBDA
# ============================

resource "aws_iam_role" "lambda_role" {
  name = "lambda-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name   = "lambda-execution-policy"
  policy = file("${path.module}/iam-policy.json")
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# ============================
# OUTPUTS
# ============================

output "s3_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "s3_frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "s3_frontend_website_endpoint" {
  value = aws_s3_bucket.frontend.website_endpoint
}

output "sqs_password_queue_url" {
  value = aws_sqs_queue.password_logs.id
}

output "sqs_auth_queue_url" {
  value = aws_sqs_queue.auth_logs.id
}

output "dynamodb_table_passwords" {
  value = aws_dynamodb_table.passwords.name
}

output "dynamodb_table_users" {
  value = aws_dynamodb_table.users.name
}

output "dynamodb_table_sessions" {
  value = aws_dynamodb_table.sessions.name
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}