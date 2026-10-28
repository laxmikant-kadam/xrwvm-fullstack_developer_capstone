#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploy Cars Dealership to IBM Cloud Code Engine.
#
#   1. ibmcloud login --sso
#   2. ibmcloud target -r us-south -g Default
#   3. ./deploy-code-engine.sh
#
# The script builds both images, pushes them to IBM Cloud Container Registry
# and creates two Code Engine applications: the Django site and the sentiment
# analysis micro-service.
# ---------------------------------------------------------------------------
set -euo pipefail

REGISTRY="us.icr.io"
REGISTRY_NAMESPACE="${REGISTRY_NAMESPACE:-cars-dealership-ns}"
PROJECT="${CE_PROJECT:-cars-dealership}"
DJANGO_APP="${DJANGO_APP:-cars-dealership}"
SENTIMENT_APP="${SENTIMENT_APP:-cars-dealership-sentiment}"
TAG="${TAG:-1.0}"

echo "==> Using IBM Cloud Container Registry namespace: ${REGISTRY_NAMESPACE}"
ibmcloud cr login
ibmcloud cr namespace-add "${REGISTRY_NAMESPACE}" || true

echo "==> Building the Django image"
docker build -t "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership:${TAG}" .

echo "==> Building the sentiment analysis image"
docker build -t "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership-sentiment:${TAG}" ./sentiment_analyzer

echo "==> Pushing images"
docker push "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership:${TAG}"
docker push "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership-sentiment:${TAG}"

echo "==> Selecting the Code Engine project"
ibmcloud ce project select --name "${PROJECT}"

echo "==> Deploying the sentiment analyser"
ibmcloud ce application create \
  --name "${SENTIMENT_APP}" \
  --image "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership-sentiment:${TAG}" \
  --port 5050 \
  --min-scale 1 --max-scale 3 \
  --registry-secret icr-secret || \
ibmcloud ce application update \
  --name "${SENTIMENT_APP}" \
  --image "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership-sentiment:${TAG}"

SENTIMENT_URL=$(ibmcloud ce application get --name "${SENTIMENT_APP}" --output url)

echo "==> Deploying the Django application"
ibmcloud ce application create \
  --name "${DJANGO_APP}" \
  --image "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership:${TAG}" \
  --port 8000 \
  --min-scale 1 --max-scale 3 \
  --env SENTIMENT_ANALYZER_URL="${SENTIMENT_URL}/analyze" \
  --env DJANGO_DEBUG=False \
  --registry-secret icr-secret || \
ibmcloud ce application update \
  --name "${DJANGO_APP}" \
  --image "${REGISTRY}/${REGISTRY_NAMESPACE}/cars-dealership:${TAG}" \
  --env SENTIMENT_ANALYZER_URL="${SENTIMENT_URL}/analyze"

DJANGO_URL=$(ibmcloud ce application get --name "${DJANGO_APP}" --output url)

echo ""
echo "=========================================================="
echo " Cars Dealership deployed successfully"
echo " Django application : ${DJANGO_URL}"
echo " Sentiment service  : ${SENTIMENT_URL}"
echo "=========================================================="
echo "${DJANGO_URL}" > deploymentURL.txt
