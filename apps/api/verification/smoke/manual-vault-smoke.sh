#!/bin/bash
set -e

echo "========================================="
echo " Vaults & Secrets Manual Smoke Test (cURL)"
echo "========================================="

# Pre-requisite: You must have a valid JWT token. 
# For testing locally, provide it as an argument or env var.
if [ -z "$JWT_TOKEN" ]; then
  echo "Error: JWT_TOKEN is not set. Please export JWT_TOKEN='ey...'"
  exit 1
fi

ORG_ID=${ORG_ID:-"test-org-id"}
API_URL=${API_URL:-"http://localhost:3000"}

echo "[1] Creating Vault..."
VAULT_RES=$(curl -s -X POST "$API_URL/organizations/$ORG_ID/vaults" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Vault", "description":"Manual verification"}')

VAULT_ID=$(echo $VAULT_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$VAULT_ID" ]; then
  echo "Failed to create Vault: $VAULT_RES"
  exit 1
fi
echo "✅ Vault Created: $VAULT_ID"

echo "[2] Creating Secret (v1)..."
SECRET_RES=$(curl -s -X POST "$API_URL/organizations/$ORG_ID/vaults/$VAULT_ID/secrets" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"SMOKE_TEST_KEY", "plaintext":"super-secret-v1", "type":"OTHER"}')

SECRET_ID=$(echo $SECRET_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$SECRET_ID" ]; then
  echo "Failed to create Secret: $SECRET_RES"
  exit 1
fi
echo "✅ Secret Created: $SECRET_ID"

echo "[3] Updating Secret (v2)..."
curl -s -X PATCH "$API_URL/organizations/$ORG_ID/vaults/$VAULT_ID/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plaintext":"super-secret-v2"}' > /dev/null
echo "✅ Secret Updated"

echo "[4] Retrieving Secret Metadata..."
META_RES=$(curl -s -X GET "$API_URL/organizations/$ORG_ID/vaults/$VAULT_ID/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")
echo "✅ Metadata Retrieved: $(echo $META_RES | grep -o '"status":"[^"]*')"

echo "[5] Revealing Secret..."
REVEAL_RES=$(curl -s -X POST "$API_URL/organizations/$ORG_ID/vaults/$VAULT_ID/secrets/$SECRET_ID/reveal" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Smoke testing"}')
PLAINTEXT=$(echo $REVEAL_RES | grep -o '"plaintext":"[^"]*' | cut -d'"' -f4)

if [ "$PLAINTEXT" == "super-secret-v2" ]; then
  echo "✅ Secret Revealed Successfully (v2)"
else
  echo "❌ Secret Reveal Failed: $REVEAL_RES"
  exit 1
fi

echo "[6] Soft Deleting Secret..."
curl -s -X DELETE "$API_URL/organizations/$ORG_ID/vaults/$VAULT_ID/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" > /dev/null
echo "✅ Secret Soft Deleted"

echo "[7] Verifying Soft Delete (Reveal Should Fail)..."
FAIL_RES=$(curl -s -w "%{http_code}" -X POST "$API_URL/organizations/$ORG_ID/vaults/$VAULT_ID/secrets/$SECRET_ID/reveal" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Should fail"}')

HTTP_STATUS=${FAIL_RES: -3}
if [[ "$HTTP_STATUS" == "500" || "$HTTP_STATUS" == "404" || "$HTTP_STATUS" == "403" ]]; then
  echo "✅ Access to Soft-Deleted Secret Rejected ($HTTP_STATUS)"
else
  echo "❌ Access to Soft-Deleted Secret Succeeded unexpectedly: $FAIL_RES"
  exit 1
fi

echo "========================================="
echo " ✅ Smoke Test Completed Successfully"
echo "========================================="
