resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda_dynamodb_policy"
  role = aws_iam_role.lambda_exec.id

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "${aws_dynamodb_table.passwords.arn}"
    }
  ]
}
POLICY
}


resource "aws_lambda_function" "getAll" {
  depends_on    = [null_resource.build_lambdas]  
  function_name = "getAll"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${path.module}/../dist/getAll.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.passwords.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "create" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "create"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${path.module}/../dist/create.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.passwords.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "delete" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "delete"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${path.module}/../dist/delete.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.passwords.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "update" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "update"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${path.module}/../dist/update.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.passwords.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}