variable "region" {
  type    = string
  default = "eu-west-3"
}

variable "access_key" {
  type    = string
  default = "test"
}

variable "secret_key" {
  type    = string
  default = "test"
}

variable "endpoint" {
  type    = string
  default = "http://localstack:4566"
}

variable "s3_bucket" {
  type    = string
  default = "password-backups"
}

variable "sqs_password_queue_name" {
  type    = string
  default = "password-logs"
}

variable "sqs_auth_queue_name" {
  type    = string
  default = "auth-logs"
}

variable "dynamodb_table" {
  type    = string
  default = "passwords"
}