# =====================
# S3 Bucket
# =====================
resource "aws_s3_bucket" "frontend" {
  bucket = var.s3_bucket
}

resource "aws_s3_bucket_acl" "frontend_acl" {
  bucket = aws_s3_bucket.frontend.id
  acl    = "public-read"
}

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

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
# HTML FILES
# =====================

resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "index.html"
  source       = "../frontend/index.html"
  acl          = "public-read"
  content_type = "text/html"
}

resource "aws_s3_object" "login" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "login.html"
  source       = "../frontend/login.html"
  acl          = "public-read"
  content_type = "text/html"
}

resource "aws_s3_object" "register" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "register.html"
  source       = "../frontend/register.html"
  acl          = "public-read"
  content_type = "text/html"
}

# =====================
# CSS
# =====================

resource "aws_s3_object" "styles" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "styles.css"
  source       = "../frontend/styles.css"
  acl          = "public-read"
  content_type = "text/css"
}

# =====================
# Top-level JS
# =====================

resource "aws_s3_object" "app_js" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "app.js"
  source       = "../frontend/app.js"
  acl          = "public-read"
  content_type = "application/javascript"
}

resource "aws_s3_object" "config" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "config.js"
  acl          = "public-read"
  content_type = "application/javascript"
  cache_control = "no-cache, no-store, must-revalidate"

  content = <<EOF
export const API_URL = "http://localhost:4566/restapis/${aws_api_gateway_rest_api.password_api.id}/v1/_user_request_";
EOF

  depends_on = [
    aws_api_gateway_stage.v1
  ]
}

resource "local_file" "frontend_config" {
  filename = "${var.frontend_path}/config.js"

  content = <<EOF
export const API_URL = "http://localhost:4566/restapis/${aws_api_gateway_rest_api.password_api.id}/v1/_user_request_";
EOF

  depends_on = [
    aws_api_gateway_stage.v1
  ]
}

# =====================
# JS FOLDER (js/*.js)
# =====================

resource "aws_s3_object" "js_auth" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "js/auth.js"
  source       = "../frontend/js/auth.js"
  acl          = "public-read"
  content_type = "application/javascript"
}

resource "aws_s3_object" "js_modal" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "js/modal.js"
  source       = "../frontend/js/modal.js"
  acl          = "public-read"
  content_type = "application/javascript"
}

resource "aws_s3_object" "js_passwords" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "js/passwords.js"
  source       = "../frontend/js/passwords.js"
  acl          = "public-read"
  content_type = "application/javascript"
}

resource "aws_s3_object" "js_utils" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "js/utils.js"
  source       = "../frontend/js/utils.js"
  acl          = "public-read"
  content_type = "application/javascript"
}