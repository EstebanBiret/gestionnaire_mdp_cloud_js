resource "aws_sqs_queue" "logs_queue" {
  name = "password-logs-queue"
}