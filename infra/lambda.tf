# Exécuter le build avant les lambdas
resource "null_resource" "build_lambdas" {
  provisioner "local-exec" {
    command = "powershell.exe -File ${path.module}/../build.ps1"
  }
}

# IAM role pour Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
POLICY
}

# Attacher une policy basique pour logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "getAll" {
  depends_on    = [null_resource.build_lambdas]  
  function_name = "getAll"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${path.module}/../dist/getAll.zip"
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_lambda_function" "create" {
  depends_on    = [null_resource.build_lambdas]  
  function_name = "create"
  runtime       = "nodejs18.x"  
  handler       = "handler.handler"  
  filename      = "${path.module}/../dist/create.zip"  
  role          = aws_iam_role.lambda_exec.arn
}