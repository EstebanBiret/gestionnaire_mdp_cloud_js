resource "aws_lambda_function" "getAll" {
  depends_on = [null_resource.build_lambdas]

  function_name = "getAll"
  runtime       = "nodejs18.x"
  handler       = "passwords/getAll/handler.handler"
  filename      = "${local.dist_path}/getAll.zip"
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "create" {
  depends_on = [null_resource.build_lambdas]

  function_name = "create"
  runtime       = "nodejs18.x"
  handler       = "passwords/create/handler.handler"
  filename      = "${local.dist_path}/create.zip"
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "register" {
  depends_on    = [null_resource.build_lambdas]  
  function_name = "register"
  runtime       = "nodejs18.x"  
  handler       = "auth/register/handler.handler" 
  filename      = "${local.dist_path}/register.zip"  
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "logout" {
  depends_on    = [null_resource.build_lambdas]  
  function_name = "logout"
  runtime       = "nodejs18.x"  
  handler       = "auth/logout/handler.handler" 
  filename      = "${local.dist_path}/logout.zip"  
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "login" {
  depends_on    = [null_resource.build_lambdas]  
  function_name = "login"
  runtime       = "nodejs18.x"  
  handler       = "auth/login/handler.handler" 
  filename      = "${local.dist_path}/login.zip"  
  role          = aws_iam_role.lambda_exec.arn
}