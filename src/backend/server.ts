import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { VietQRService } from './services/vietqr.service';
import { GeminiService } from './services/gemini.service';
import { QRController } from './controllers/qr.controller';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../../dist/frontend')));

// Initialize services
const vietQRService = new VietQRService(
    process.env.VIETQR_CLIENT_ID || '',
    process.env.VIETQR_API_KEY || ''
);

const geminiService = new GeminiService(
    process.env.GEMINI_API_KEY || ''
);

// Initialize controller
const qrController = new QRController(vietQRService, geminiService);

// Routes
app.post('/api/generate-qr', (req, res) => {
    qrController.generateQR(req, res);
});

app.get('/api/banks', (req, res) => {
    qrController.getBanks(req, res);
});

app.get('/api/bank-deeplinks', (req, res) => {
    qrController.getBankDeeplinks(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            vietqr: !!process.env.VIETQR_CLIENT_ID && !!process.env.VIETQR_API_KEY,
            gemini: !!process.env.GEMINI_API_KEY
        }
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Serve the frontend for any non-API routes
app.get('*', (req, res) => {
    // If it's an API route that doesn't exist, return 404
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: 'API endpoint not found'
        });
    } else {
        // Otherwise serve the frontend
        res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏦 Banks API: http://localhost:${PORT}/api/banks`);
    console.log(`🔗 Bank Deeplinks API: http://localhost:${PORT}/api/bank-deeplinks`);
    console.log(`🔗 QR Generation: http://localhost:${PORT}/api/generate-qr`);

    // Check environment variables
    const missingVars = [];
    if (!process.env.VIETQR_CLIENT_ID) missingVars.push('VIETQR_CLIENT_ID');
    if (!process.env.VIETQR_API_KEY) missingVars.push('VIETQR_API_KEY');
    if (!process.env.GEMINI_API_KEY) missingVars.push('GEMINI_API_KEY');

    if (missingVars.length > 0) {
        console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
        console.warn('   Please check your .env file');
    } else {
        console.log('✅ All environment variables are configured');
    }
});
