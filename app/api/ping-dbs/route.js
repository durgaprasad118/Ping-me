import { NextResponse } from 'next/server';
import { Client } from 'pg';

// Array of database URLs from environment variables
const dbUrls = [
    process.env.DB1_URL,
    process.env.DB2_URL,
    process.env.DB3_URL
].filter(Boolean); // Remove any undefined URLs

// Corresponding database names
const dbNames = [
    'Lockin',
    'Medium', 
    'TaskMaestro'
];

async function pingDb(url, name) {
    try {
        // Parse the connection string manually
        const urlObj = new URL(url);
        
        const client = new Client({
            user: urlObj.username,
            password: urlObj.password,
            host: urlObj.hostname,
            port: urlObj.port,
            database: urlObj.pathname.substring(1), // Remove leading slash
            ssl: {
                rejectUnauthorized: false, // Accept self-signed certificates
                require: true // But still require SSL connection
            }
        });
        
        await client.connect();
        await client.query('SELECT 1;');
        await client.end();
        
        return { name, status: 'success', message: 'Connected successfully' };
    } catch (error) {
        return { name, status: 'error', message: error.message };
    }
}

export async function GET() {
    try {
        const results = await Promise.all(
            dbUrls.map((url, index) => pingDb(url, dbNames[index] || `Database ${index + 1}`))
        );
        
        return NextResponse.json({ 
            ok: true, 
            results,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 }
        );
    }
}
