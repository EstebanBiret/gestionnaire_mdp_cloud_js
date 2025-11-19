# =====================
# API Gateway
# =====================
resource "aws_api_gateway_rest_api" "password_api" {
  name = "password-api"
}

# Resource GET & POST password
resource "aws_api_gateway_resource" "passwords" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "passwords"
}


# GET /passwords
resource "aws_api_gateway_method" "get_passwords" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.passwords.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_passwords_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.passwords.id
  http_method             = aws_api_gateway_method.get_passwords.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.getAll.invoke_arn
}

# POST /passwords
resource "aws_api_gateway_method" "post_passwords" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.passwords.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_passwords_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.passwords.id
  http_method             = aws_api_gateway_method.post_passwords.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.create.invoke_arn
}

# Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.get_passwords_integration,
    aws_api_gateway_integration.post_passwords_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  stage_name  = "dev"
}

# Output
output "api_url" {
  value = aws_api_gateway_deployment.api_deployment.invoke_url
}