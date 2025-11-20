output "api_gateway_id" {
  value = aws_api_gateway_rest_api.password_api.id
}

output "frontend_website_url" {
  value = "${var.endpoint}/${aws_s3_bucket.frontend.bucket}/index.html"
}