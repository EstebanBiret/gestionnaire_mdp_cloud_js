# ============================
# API GATEWAY REST API
# ============================

resource "aws_api_gateway_rest_api" "password_api" {
  name        = "password-manager-api"
  description = "API for password manager"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# ============================
# CORS Configuration
# ============================

resource "aws_api_gateway_gateway_response" "cors" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
  }
}

# ============================
# RESOURCES
# ============================

# /auth
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "auth"
}

# /auth/login
resource "aws_api_gateway_resource" "login" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

# /auth/register
resource "aws_api_gateway_resource" "register" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

# /auth/logout
resource "aws_api_gateway_resource" "logout" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "logout"
}

# /passwords
resource "aws_api_gateway_resource" "passwords" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "passwords"
}

# /passwords/{id}
resource "aws_api_gateway_resource" "password_id" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.passwords.id
  path_part   = "{id}"
}

# ============================
# METHODS WILL BE CREATED BY SETUP SCRIPT
# ============================
# Les méthodes et intégrations Lambda seront créées par le script
# setup_lambdas.sh car il faut d'abord déployer les Lambdas

# ============================
# DEPLOYMENT
# ============================

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id

  # Force re-deployment on any change
  triggers = {
    redeployment = timestamp()
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_resource.auth,
    aws_api_gateway_resource.login,
    aws_api_gateway_resource.register,
    aws_api_gateway_resource.logout,
    aws_api_gateway_resource.passwords,
    aws_api_gateway_resource.password_id
  ]
}

resource "aws_api_gateway_stage" "dev" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  stage_name    = "dev"
}

# ============================
# OUTPUTS
# ============================

output "api_gateway_id" {
  value = aws_api_gateway_rest_api.password_api.id
}

output "api_gateway_url" {
  value = "${aws_api_gateway_stage.dev.invoke_url}"
}

output "api_gateway_auth_resource_id" {
  value = aws_api_gateway_resource.auth.id
}

output "api_gateway_login_resource_id" {
  value = aws_api_gateway_resource.login.id
}

output "api_gateway_register_resource_id" {
  value = aws_api_gateway_resource.register.id
}

output "api_gateway_logout_resource_id" {
  value = aws_api_gateway_resource.logout.id
}

output "api_gateway_passwords_resource_id" {
  value = aws_api_gateway_resource.passwords.id
}

output "api_gateway_password_id_resource_id" {
  value = aws_api_gateway_resource.password_id.id
}