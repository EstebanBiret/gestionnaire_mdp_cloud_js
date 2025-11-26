resource "aws_lambda_function" "getAll" {
  depends_on = [null_resource.build_lambdas]

  function_name = "getAll"
  runtime       = "nodejs18.x"
  handler       = "handler.handler" 
  filename      = "${local.dist_path}/getAll.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.passwords.name
      LOGS_QUEUE_URL    = aws_sqs_queue.logs_queue.url
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "create" {
  depends_on = [null_resource.build_lambdas]

  function_name = "create"
  runtime       = "nodejs18.x"
  handler       = "handler.handler" 
  filename      = "${local.dist_path}/create.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.passwords.name
      LOGS_QUEUE_URL    = aws_sqs_queue.logs_queue.url
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
      LOGS_QUEUE_URL    = aws_sqs_queue.logs_queue.url
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
      LOGS_QUEUE_URL    = aws_sqs_queue.logs_queue.url
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "register" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "register"
  runtime       = "nodejs18.x"
  handler       = "handler.handler" 
  filename      = "${local.dist_path}/register.zip"
  role          = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      USERS_TABLE       = aws_dynamodb_table.users.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "logout" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "logout"
  runtime       = "nodejs18.x"
  handler       = "handler.handler" 
  filename      = "${local.dist_path}/logout.zip"
  role          = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      USERS_TABLE       = aws_dynamodb_table.users.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "login" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "login"
  runtime       = "nodejs18.x"
  handler       = "handler.handler" 
  filename      = "${local.dist_path}/login.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      USERS_TABLE       = aws_dynamodb_table.users.name
      DYNAMODB_ENDPOINT = var.endpoint
    }
  }
}

resource "aws_lambda_function" "authorizer" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "authorizer"
  runtime       = "nodejs18.x"
  handler       = "handler.handler" 
  filename      = "${local.dist_path}/authorizer.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
    }
  }
}

resource "aws_lambda_function" "sqs_logs" {
  depends_on    = [null_resource.build_lambdas]
  function_name = "sqs_logs"
  runtime       = "nodejs18.x"
  handler       = "handler.handler"
  filename      = "${local.dist_path}/logs.zip"
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      LOGS_TABLE = aws_dynamodb_table.logs.name
    }
  }
}

resource "aws_lambda_event_source_mapping" "logs_trigger" {
  event_source_arn  = aws_sqs_queue.logs_queue.arn
  function_name     = aws_lambda_function.sqs_logs.arn
  batch_size        = 10
}