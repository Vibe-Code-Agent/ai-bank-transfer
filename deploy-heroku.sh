#!/bin/bash

# Heroku Deployment Script for AI Bank Transfer QR Generator
# This script automates the deployment process to Heroku

set -e  # Exit on any error

echo "🚀 Starting Heroku deployment process..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku first:"
    heroku login
fi

# Get app name from user
read -p "📝 Enter your Heroku app name (or press Enter to create a new one): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "🆕 Creating new Heroku app..."
    APP_NAME=$(heroku create --json | jq -r '.name')
    echo "✅ Created app: $APP_NAME"
else
    echo "🔗 Using existing app: $APP_NAME"
fi

# Check if app exists
if ! heroku apps:info --app "$APP_NAME" &> /dev/null; then
    echo "❌ App '$APP_NAME' does not exist. Please create it first or check the name."
    exit 1
fi

echo "📦 Building the application..."
npm run build

echo "📋 Setting up environment variables..."
echo "Please provide the following API keys:"

# Get Gemini API key
read -p "🤖 Enter your Gemini API key: " GEMINI_KEY
if [ -n "$GEMINI_KEY" ]; then
    heroku config:set GEMINI_API_KEY="$GEMINI_KEY" --app "$APP_NAME"
    echo "✅ Gemini API key set"
fi

# Get VietQR credentials
read -p "🏦 Enter your VietQR Client ID: " VIETQR_CLIENT_ID
if [ -n "$VIETQR_CLIENT_ID" ]; then
    heroku config:set VIETQR_CLIENT_ID="$VIETQR_CLIENT_ID" --app "$APP_NAME"
    echo "✅ VietQR Client ID set"
fi

read -p "🔑 Enter your VietQR API Key: " VIETQR_API_KEY
if [ -n "$VIETQR_API_KEY" ]; then
    heroku config:set VIETQR_API_KEY="$VIETQR_API_KEY" --app "$APP_NAME"
    echo "✅ VietQR API Key set"
fi

echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku" || echo "No changes to commit"
git push heroku main

echo "🎉 Deployment completed!"
echo "🌐 Your app is available at: https://$APP_NAME.herokuapp.com"
echo "📊 Health check: https://$APP_NAME.herokuapp.com/api/health"

# Open the app
read -p "🌐 Would you like to open the app in your browser? (y/n): " OPEN_APP
if [[ $OPEN_APP =~ ^[Yy]$ ]]; then
    heroku open --app "$APP_NAME"
fi

echo "✅ Deployment script completed successfully!"
