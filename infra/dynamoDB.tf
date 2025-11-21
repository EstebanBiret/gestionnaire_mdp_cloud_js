resource "aws_dynamodb_table" "passwords" {
  name         = "passwords"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "site"
    type = "S"
  }

  global_secondary_index {
    name            = "site-index"
    hash_key        = "site"
    projection_type = "ALL"
  }

  tags = {
    Name        = "passwords-table"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "username"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "username-index"
    hash_key        = "username"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "sessionExpiry"
    enabled        = true
  }

  attribute {
    name = "sessionToken"
    type = "S"
  }

  global_secondary_index {
    name            = "sessionToken-index"
    hash_key        = "sessionToken"
    projection_type = "ALL"
  }

  tags = {
    Name        = "users-table"
    Environment = "dev"
  }
}