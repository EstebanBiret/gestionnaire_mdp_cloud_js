resource "null_resource" "build_lambdas" {
  provisioner "local-exec" {
    command = "powershell.exe -File ${path.module}/../build.ps1"
  }

  triggers = {
    always_run = timestamp()
  }
}