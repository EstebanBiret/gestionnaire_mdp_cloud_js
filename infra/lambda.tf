resource "aws_lambda_function" "getAll" {
  depends_on = [null_resource.build_lambdas]

  function_name = "getAll"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${local.dist_path}/getAll.zip"
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "create" {
  depends_on = [null_resource.build_lambdas]

  function_name = "create"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${local.dist_path}/create.zip"
  role          = aws_iam_role.lambda_exec.arn
}