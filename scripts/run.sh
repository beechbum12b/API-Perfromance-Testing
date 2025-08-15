#!/bin/bash

echo "🚀 Running k6 performance test..."
echo ""

# Check if AUTH_TOKEN is set
if [ -z "$AUTH_TOKEN" ]; then
    echo "🔐 Bearer Token Required"
    echo "   This test requires authentication for the API endpoint."
    echo ""

    # Prompt for the Bearer token
    read -p "   Enter your Bearer token: " AUTH_TOKEN

    # Check if user provided a token
    if [ -z "$AUTH_TOKEN" ]; then
        echo ""
        echo "❌ No token provided. Exiting."
        echo ""
        echo "   You can also set the token as an environment variable:"
        echo "   export AUTH_TOKEN=\"your-bearer-token-here\""
        echo ""
        exit 1
    fi

    echo ""
    echo "✅ Token received (${#AUTH_TOKEN} characters)"
    echo ""
fi

echo "✅ AUTH_TOKEN is set"
echo "🌐 Testing endpoint: https://dev-api.acexr.com/platform-services/v2/users/me"
echo "👥 Load: 100 concurrent users over 1 minute"
echo ""

# Run the k6 test
k6 run scripts/main.js

echo ""
echo "🏁 Test completed! Check the results above."
