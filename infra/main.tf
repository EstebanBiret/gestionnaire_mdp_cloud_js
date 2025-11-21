# =====================
# S3 Bucket
# =====================
resource "aws_s3_bucket" "frontend" {
  bucket = var.s3_bucket
}

# Bucket ACL
resource "aws_s3_bucket_acl" "frontend_acl" {
  bucket = aws_s3_bucket.frontend.id
  acl    = "public-read"
}

# Website configuration
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# CORS
resource "aws_s3_bucket_cors_configuration" "frontend_cors" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# =====================
# Objects
# =====================
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

resource "aws_s3_object" "config" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "config.js"
  content = <<EOF
export const API_URL = "http://localhost:4566/restapis/${aws_api_gateway_rest_api.password_api.id}/dev/_user_request_";
EOF
  acl          = "public-read"
  content_type = "application/javascript"
  depends_on = [
    aws_api_gateway_deployment.api_deployment
  ]
}

resource "local_file" "frontend_config" {
  content = <<EOF
export const API_URL = "http://localhost:4566/restapis/${aws_api_gateway_rest_api.password_api.id}/dev/_user_request_";
EOF

  filename = "${var.frontend_path}/config.js"

  depends_on = [
    aws_api_gateway_deployment.api_deployment
  ]
}