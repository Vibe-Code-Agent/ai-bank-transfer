# AI Bank Transfer QR Code Generator

A modern web application that uses AI (Gemini) to parse natural language bank transfer instructions and generate QR codes for Vietnamese bank transfers using the VietQR API.

## Features

- 🤖 **AI-Powered Parsing**: Uses Google Gemini AI to understand natural language input
- 🏦 **55+ Supported Banks**: Integrates with VietQR API supporting all major Vietnamese banks
- 📱 **Modern Web UI**: Beautiful, responsive interface with glassmorphism design
- 🔗 **Flexible Input**: Accept various natural language formats for bank transfers
- 📊 **Real-time Processing**: Instant QR code generation with detailed transfer information
- 💾 **Download & Share**: Download QR codes or copy links for sharing
- 🔍 **Smart Account Lookup**: Automatically looks up account holder names when not provided in input

## Example Usage

Input natural language like:
- `"vpbank NGUYEN TRUONG GIANG 250k tai so 1234567890"`
- `"techcombank NGUYEN VAN A 500k tai so 9876543210"`
- `"chuyen 1tr cho NGUYEN THI B tai bidv so 5555555555"`

The AI will extract:
- Bank name (vpbank, techcombank, bidv, etc.)
- Account holder name (or lookup via VietQR API if not found)
- Amount (converts "250k" → "250000", "1tr" → "1000000")
- Account number (if mentioned in the text)
- Transfer message (if provided)

**Smart Fallback**: If the AI cannot parse the account holder name from the input, the system will automatically attempt to look it up using the VietQR account lookup API based on the bank and account number.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Gemini AI API key
- VietQR API credentials

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-bank-transfer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your credentials:
   ```env
   # Gemini AI API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # VietQR API Credentials
   VIETQR_CLIENT_ID=your_vietqr_client_id_here
   VIETQR_API_KEY=your_vietqr_api_key_here
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

## Getting API Credentials

### Gemini AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### VietQR API Credentials
1. Visit [My VietQR](https://my.vietqr.io)
2. Register for an account
3. Get your Client ID and API Key
4. Add them to your `.env` file

## Running the Application

### Development Mode
```bash
# Run both backend and frontend concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Production Mode
```bash
# Build the application
npm run build

# Start the production server
npm start
```

## API Endpoints

### Generate QR Code
```
POST /api/generate-qr
Content-Type: application/json

{
  "inputText": "vpbank NGUYEN TRUONG GIANG 250k tai so 1234567890",
  "accountNumber": "1234567890"  // Optional - can be included in inputText
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "bankInfo": {
      "bankName": "Ngân hàng TMCP Việt Nam Thịnh Vượng",
      "bankCode": "VPB",
      "accountName": "NGUYEN TRUONG GIANG",
      "amount": "250000",
      "message": ""
    }
  }
}
```

### Get Supported Banks
```
GET /api/banks
```

### Health Check
```
GET /api/health
```

## Project Structure

```
ai-bank-transfer/
├── src/
│   ├── backend/
│   │   ├── services/
│   │   │   ├── vietqr.service.ts      # VietQR API integration
│   │   │   └── gemini.service.ts      # Gemini AI integration
│   │   ├── controllers/
│   │   │   └── qr.controller.ts       # QR generation controller
│   │   └── server.ts                   # Express server setup
│   └── frontend/
│       ├── index.html                  # Main HTML page
│       ├── styles.css                  # Modern CSS styling
│       └── app.ts                      # Frontend JavaScript
├── dist/                               # Built files
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Supported Banks

The application supports all banks available in the VietQR API, including:

- **VPBank** (VPB) - Ngân hàng TMCP Việt Nam Thịnh Vượng
- **Techcombank** (TCB) - Ngân hàng TMCP Kỹ thương Việt Nam
- **BIDV** (BID) - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam
- **VietinBank** (CTG) - Ngân hàng TMCP Công thương Việt Nam
- **ACB** (ACB) - Ngân hàng TMCP Á Châu
- **Sacombank** (STB) - Ngân hàng TMCP Sài Gòn Thương Tín
- And 50+ more banks...

## Input Format Examples

The AI can understand various natural language formats:

### Basic Format with Account Number
```
"vpbank NGUYEN TRUONG GIANG 250k tai so 1234567890"
```

### With Transfer Message
```
"chuyen 500k cho NGUYEN VAN A tai techcombank so 9876543210 thanh toan tien nha"
```

### Different Amount Formats
```
"bidv NGUYEN THI B 1tr tai so 5555555555"           # 1 million VND
"acb NGUYEN VAN C 1.5tr tai so 1111111111"          # 1.5 million VND
"sacombank NGUYEN THI D 500k tai so 9999999999"     # 500 thousand VND
```

### Without Account Number in Text
```
"vpbank NGUYEN TRUONG GIANG 250k"  # Account number provided separately
```

### Without Account Name (Auto-lookup)
```
"vpbank 250k tai so 1234567890"  # Account name will be looked up automatically
"techcombank 500k so 9876543210"  # System will find account holder name
```

### Bank Name Variations
- `vpbank` or `VPBank`
- `techcombank` or `TCB`
- `bidv` or `BIDV`
- `vietinbank` or `VietinBank`

## Error Handling

The application includes comprehensive error handling for:

- Invalid bank names
- Malformed input text
- API rate limits
- Network connectivity issues
- Missing environment variables

## Development

### Backend Development
```bash
npm run dev:backend
```

### Frontend Development
```bash
npm run dev:frontend
```

### TypeScript Compilation
```bash
npm run build:backend
npm run build:frontend
```

## Technologies Used

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: HTML5, CSS3, TypeScript, Vite
- **AI**: Google Gemini AI API
- **QR Generation**: VietQR API
- **Styling**: Modern CSS with glassmorphism effects
- **Icons**: Font Awesome

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the [VietQR Documentation](https://www.vietqr.io)
- Review the API health endpoint: `GET /api/health`
- Check browser console for frontend errors
- Check server logs for backend errors

## Changelog

### v1.0.0
- Initial release
- AI-powered natural language parsing
- VietQR integration
- Modern web interface
- Support for 55+ Vietnamese banks
