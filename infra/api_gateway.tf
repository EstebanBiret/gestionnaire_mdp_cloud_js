resource "aws_api_gateway_rest_api" "password_api" {
  name = "password-api"
}

# ==============================================================================
# RESSOURCES
# ==============================================================================

resource "aws_api_gateway_resource" "passwords" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "passwords"
}

resource "aws_api_gateway_resource" "password_by_id" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.passwords.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "auth_register" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

resource "aws_api_gateway_resource" "auth_logout" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "logout"
}

resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

resource "aws_api_gateway_resource" "auth_me" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "me"
}


# ==============================================================================
# MÉTHODES & INTÉGRATIONS
# ==============================================================================

# GET /auth/me (DOIT ÊTRE PROTÉGÉ)
resource "aws_api_gateway_method" "get_auth_me" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.auth_me.id
  http_method   = "GET"

  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_auth_me_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.auth_me.id
  http_method             = aws_api_gateway_method.get_auth_me.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.me.invoke_arn
}

# GET /passwords (PROTÉGÉ)
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

# POST /passwords (PROTÉGÉ)
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

# DELETE /passwords/{id} (PROTÉGÉ)
resource "aws_api_gateway_method" "delete_password" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.password_by_id.id
  http_method   = "DELETE"

  # CORRECTION
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "delete_password_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.password_by_id.id
  http_method             = aws_api_gateway_method.delete_password.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.delete.invoke_arn
}

# PUT /passwords/{id} (PROTÉGÉ)
resource "aws_api_gateway_method" "update_password" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.password_by_id.id
  http_method   = "PUT"

  # CORRECTION
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_password_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.password_by_id.id
  http_method             = aws_api_gateway_method.update_password.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.update.invoke_arn
}

# POST /auth/register (PUBLIC)
resource "aws_api_gateway_method" "post_auth_register" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_auth_register_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.auth_register.id
  http_method             = aws_api_gateway_method.post_auth_register.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.register.invoke_arn
}

# POST /auth/logout (PROTÉGÉ - Pour invalider côté serveur)
resource "aws_api_gateway_method" "post_auth_logout" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.auth_logout.id
  http_method   = "POST"

  # CORRECTION
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_auth_logout_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.auth_logout.id
  http_method             = aws_api_gateway_method.post_auth_logout.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.logout.invoke_arn
}

# POST /auth/login (PUBLIC)
resource "aws_api_gateway_method" "post_auth_login" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"

  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_auth_login_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.auth_login.id
  http_method             = aws_api_gateway_method.post_auth_login.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.login.invoke_arn
}

# ==============================================================================
# DÉPLOIEMENT
# ==============================================================================

resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.get_passwords_integration,
    aws_api_gateway_integration.post_passwords_integration,
    aws_api_gateway_integration.delete_password_integration,
    aws_api_gateway_integration.update_password_integration,
    aws_api_gateway_integration.post_auth_register_integration,
    aws_api_gateway_integration.post_auth_logout_integration,
    aws_api_gateway_integration.post_auth_login_integration,
    aws_api_gateway_integration.get_auth_me_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.password_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.get_auth_me.authorization,
      aws_api_gateway_method.get_passwords.authorization
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "v1" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  stage_name    = "v1"
}