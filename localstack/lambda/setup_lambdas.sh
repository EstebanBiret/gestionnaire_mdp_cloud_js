#!/bin/bash
set -e

echo "🚀 Starting Lambda deployment..."

# Attendre que LocalStack soit prêt
echo "⏳ Waiting for LocalStack..."
sleep 5

# Configuration
REGION="eu-west-3"
ENDPOINT="http://localstack:4566"
ROLE_ARN="arn:aws:iam::000000000000:role/lambda-execution-role"

# Installer les dépendances
echo "📦 Installing dependencies..."
cd /workspace/lambdas
npm install --production

# Fonction pour créer et déployer une Lambda
deploy_lambda() {
  local FUNCTION_NAME=$1
  local HANDLER=$2
  local ZIP_FILE="/tmp/${FUNCTION_NAME}.zip"
  
  echo "📦 Creating package for ${FUNCTION_NAME}..."
  
  # Créer le zip avec le handler et les dépendances
  cd /workspace/lambdas
  zip -r ${ZIP_FILE} ${HANDLER} shared/ node_modules/ > /dev/null 2>&1
  
  echo "🚀 Deploying ${FUNCTION_NAME}..."
  
  # Supprimer la fonction si elle existe
  awslocal lambda delete-function \
    --function-name ${FUNCTION_NAME} \
    --region ${REGION} 2>/dev/null || true
  
  # Créer la fonction
  awslocal lambda create-function \
    --function-name ${FUNCTION_NAME} \
    --runtime nodejs18.x \
    --handler ${HANDLER} \
    --role ${ROLE_ARN} \
    --zip-file fileb://${ZIP_FILE} \
    --region ${REGION} \
    --timeout 30 \
    --memory-size 256 \
    --environment Variables="{AWS_ENDPOINT=http://localstack:4566,AWS_REGION=eu-west-3}" \
    > /dev/null
  
  echo "✅ ${FUNCTION_NAME} deployed"
}

# Déployer toutes les Lambdas
deploy_lambda "auth-login" "auth/login.handler"
deploy_lambda "auth-register" "auth/register.handler"
deploy_lambda "auth-logout" "auth/logout.handler"
deploy_lambda "passwords-getAll" "passwords/getAll.handler"
deploy_lambda "passwords-create" "passwords/create.handler"
deploy_lambda "passwords-update" "passwords/update.handler"
deploy_lambda "passwords-delete" "passwords/delete.handler"

echo "🔗 Configuring API Gateway..."

# Récupérer l'ID de l'API Gateway depuis Terraform outputs
cd /workspace/infra
API_ID=$(tofu output -raw api_gateway_id)
echo "API Gateway ID: ${API_ID}"

# Fonction pour créer une intégration Lambda
create_integration() {
  local RESOURCE_ID=$1
  local HTTP_METHOD=$2
  local LAMBDA_NAME=$3
  
  # Créer la méthode
  awslocal apigateway put-method \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method ${HTTP_METHOD} \
    --authorization-type NONE \
    --region ${REGION} \
    > /dev/null 2>&1 || true
  
  # Créer l'intégration Lambda
  awslocal apigateway put-integration \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method ${HTTP_METHOD} \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:000000000000:function:${LAMBDA_NAME}/invocations" \
    --region ${REGION} \
    > /dev/null
  
  # Ajouter les méthodes OPTIONS pour CORS
  awslocal apigateway put-method \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region ${REGION} \
    > /dev/null 2>&1 || true
  
  awslocal apigateway put-integration \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
    --region ${REGION} \
    > /dev/null 2>&1 || true
  
  awslocal apigateway put-integration-response \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'*'"'"'", "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'", "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"}' \
    --region ${REGION} \
    > /dev/null 2>&1 || true
  
  awslocal apigateway put-method-response \
    --rest-api-id ${API_ID} \
    --resource-id ${RESOURCE_ID} \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers": true, "method.response.header.Access-Control-Allow-Methods": true, "method.response.header.Access-Control-Allow-Origin": true}' \
    --region ${REGION} \
    > /dev/null 2>&1 || true
}

# Récupérer les IDs des resources
LOGIN_ID=$(tofu output -raw api_gateway_login_resource_id)
REGISTER_ID=$(tofu output -raw api_gateway_register_resource_id)
LOGOUT_ID=$(tofu output -raw api_gateway_logout_resource_id)
PASSWORDS_ID=$(tofu output -raw api_gateway_passwords_resource_id)
PASSWORD_ID_ID=$(tofu output -raw api_gateway_password_id_resource_id)

# Créer les intégrations
create_integration ${LOGIN_ID} POST auth-login
create_integration ${REGISTER_ID} POST auth-register
create_integration ${LOGOUT_ID} POST auth-logout
create_integration ${PASSWORDS_ID} GET passwords-getAll
create_integration ${PASSWORDS_ID} POST passwords-create
create_integration ${PASSWORD_ID_ID} PUT passwords-update
create_integration ${PASSWORD_ID_ID} DELETE passwords-delete

# Redéployer l'API
echo "🔄 Deploying API Gateway..."
awslocal apigateway create-deployment \
  --rest-api-id ${API_ID} \
  --stage-name dev \
  --region ${REGION} \
  > /dev/null

API_URL=$(tofu output -raw api_gateway_url)
echo "✅ API Gateway deployed at: ${API_URL}"

echo "🎉 All Lambdas and API Gateway configured successfully!"
echo ""
echo "📝 API Endpoints:"
echo "  POST   ${API_URL}/auth/login"
echo "  POST   ${API_URL}/auth/register"
echo "  POST   ${API_URL}/auth/logout"
echo "  GET    ${API_URL}/passwords"
echo "  POST   ${API_URL}/passwords"
echo "  PUT    ${API_URL}/passwords/{id}"
echo "  DELETE ${API_URL}/passwords/{id}"