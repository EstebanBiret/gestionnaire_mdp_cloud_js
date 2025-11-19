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
  s3 = var.endpoint
  }
}

resource "aws_s3_bucket" "frontend" {
bucket = "app"
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

resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "index.html"
  source       = "../frontend/index.html"
  acl          = "public-read"
  content_type = "text/html"
}

resource "aws_s3_object" "styles" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "styles.css"
  source       = "../frontend/styles.css"
  acl          = "public-read"
  content_type = "text/css"
}

resource "aws_s3_object" "app" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "app.js"
  source       = "../frontend/app.js"
  acl          = "public-read"
  content_type = "application/javascript"
}

output "frontend_website_url" {
  value = aws_s3_bucket.frontend.website_endpoint
}