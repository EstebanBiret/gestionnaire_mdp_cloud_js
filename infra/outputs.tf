output "frontend_website_url" {
  value = "${var.endpoint}/${aws_s3_bucket.frontend.bucket}/index.html"
}