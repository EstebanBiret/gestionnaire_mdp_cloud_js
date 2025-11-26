resource "aws_api_gateway_rest_api" "password_api" {
  name = "password-api"
}

# Ressource /passwords
resource "aws_api_gateway_resource" "passwords" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "passwords"
}

# Ressource /passwords/{id}
resource "aws_api_gateway_resource" "password_by_id" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.passwords.id
  path_part   = "{id}"
}

# Ressource /auth
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_rest_api.password_api.root_resource_id
  path_part   = "auth"
}

# Ressource /auth/register
resource "aws_api_gateway_resource" "auth_register" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

# Ressource /auth/logout
resource "aws_api_gateway_resource" "auth_logout" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "logout"
}

# Ressource /auth/login
resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.password_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}


# GET /passwords
# -------------------------------
resource "aws_api_gateway_method" "get_passwords" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.passwords.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "get_passwords_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.passwords.id
  http_method             = aws_api_gateway_method.get_passwords.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.getAll.invoke_arn
}

# -------------------------------
# POST /passwords
# -------------------------------
resource "aws_api_gateway_method" "post_passwords" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.passwords.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "post_passwords_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.passwords.id
  http_method             = aws_api_gateway_method.post_passwords.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.create.invoke_arn
}

# DELETE /passwords/{id}
resource "aws_api_gateway_method" "delete_password" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.password_by_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "delete_password_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.password_by_id.id
  http_method             = aws_api_gateway_method.delete_password.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.delete.invoke_arn
}

# PUT /passwords/{id}
resource "aws_api_gateway_method" "update_password" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.password_by_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "update_password_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.password_by_id.id
  http_method             = aws_api_gateway_method.update_password.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.update.invoke_arn
}

# POST /auth/register
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

# POST /auth/logout
resource "aws_api_gateway_method" "post_auth_logout" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.auth_logout.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "post_auth_logout_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.auth_logout.id
  http_method             = aws_api_gateway_method.post_auth_logout.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.logout.invoke_arn
}

# POST /auth/login
resource "aws_api_gateway_method" "post_auth_login" {
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "post_auth_login_integration" {
  rest_api_id             = aws_api_gateway_rest_api.password_api.id
  resource_id             = aws_api_gateway_resource.auth_login.id
  http_method             = aws_api_gateway_method.post_auth_login.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.login.invoke_arn
}

# Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.get_passwords_integration,
    aws_api_gateway_integration.post_passwords_integration,
    aws_api_gateway_integration.delete_password_integration,
    aws_api_gateway_integration.update_password_integration,
    aws_api_gateway_integration.post_auth_register_integration,
    aws_api_gateway_integration.post_auth_logout_integration,
    aws_api_gateway_integration.post_auth_login_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.password_api.id
}

resource "aws_api_gateway_authorizer" "lambda_authorizer" {
  name                   = "lambda-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.password_api.id
  authorizer_uri         = aws_lambda_function.authorizer.invoke_arn
  authorizer_credentials = aws_iam_role.api_gateway_authorizer.arn
  type                   = "TOKEN"
  identity_source        = "method.request.header.Authorization"
}

resource "aws_api_gateway_stage" "dev" {
  stage_name    = "dev"
  rest_api_id   = aws_api_gateway_rest_api.password_api.id
  deployment_id = aws_api_gateway_deployment.api_deployment.id
}